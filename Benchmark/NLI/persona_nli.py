import json
import argparse
from typing import Dict, List, Tuple
from collections import defaultdict

from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline

try:
    # Works when the repo is installed as a package
    from Benchmark.NLI.helpers import split_answer_to_hypotheses
except ModuleNotFoundError:
    # Fallback for running the script directly (`python Benchmark/NLI/persona_nli.py`)
    from helpers import split_answer_to_hypotheses

# Labels mapping for MNLI-style models
MNLI_LABELS = {
    0: "CONTRADICTION",
    1: "NEUTRAL",
    2: "ENTAILMENT",
}
# Some checkpoints use different index orders; the pipeline's labels are safer.
LABEL_NORMALIZE = {
    "entailment": "ENTAILMENT",
    "neutral": "NEUTRAL",
    "contradiction": "CONTRADICTION",
    "CONTRADICTION": "CONTRADICTION",
    "NEUTRAL": "NEUTRAL",
    "ENTAILMENT": "ENTAILMENT",
}


CANON = {"entailment":"ENTAILMENT","neutral":"NEUTRAL","contradiction":"CONTRADICTION"}

def load_pipeline(model_name: str):
    tok = AutoTokenizer.from_pretrained(model_name)
    mdl = AutoModelForSequenceClassification.from_pretrained(model_name)
    nli = pipeline(
        task="text-classification",
        model=mdl,
        tokenizer=tok,
        top_k=None,  # force full distribution
        truncation=True
    )
    # build a safe id→label map if needed later
    id2label = {int(k): v.upper() for k, v in mdl.config.id2label.items()} if hasattr(mdl.config, "id2label") else {}
    return nli, id2label


def _canon_label(raw: str, id2label: dict) -> str:
    if not isinstance(raw, str):
        return "NEUTRAL"
    s = raw.strip()
    if s.upper().startswith("LABEL_"):
        # e.g., LABEL_0 → use id2label if available
        try:
            idx = int(s.split("_", 1)[1])
            return id2label.get(idx, "NEUTRAL")
        except Exception:
            return "NEUTRAL"
    return CANON.get(s.lower(), s.upper())


def pairwise_nli(nli, premises: List[str], hypotheses: List[str], id2label: dict=None) -> List[Dict]:
    """
    Robust to different pipeline outputs across transformers versions.
    Batches inputs for speed and stability.
    """
    id2label = id2label or {}
    inputs = [{"text": p, "text_pair": h} for h in hypotheses for p in premises]
    if not inputs:
        return []

    raw = nli(inputs)  # with return_all_scores=True this should be: List[List[{"label","score"}, ...]]
    results = []
    for (inp, out) in zip(inputs, raw):
        # Normalize 'out' into a list[{'label':..., 'score':...}, ...]
        if isinstance(out, dict) and "label" in out and "score" in out:
            out = [out]  # single dict → list
        if not isinstance(out, list):
            # Unexpected shape; fall back to NEUTRAL
            scores = {"ENTAILMENT": 0.0, "NEUTRAL": 1.0, "CONTRADICTION": 0.0}
        else:
            scores = {}
            for d in out:
                if not isinstance(d, dict) or "label" not in d or "score" not in d:
                    continue
                lab = _canon_label(d["label"], id2label)
                try:
                    sc = float(d["score"])
                except Exception:
                    sc = 0.0
                scores[lab] = sc
            # Ensure all three keys exist
            for k in ("ENTAILMENT","NEUTRAL","CONTRADICTION"):
                scores.setdefault(k, 0.0)
            # Renormalize if needed
            ssum = sum(scores.values()) or 1.0
            for k in scores:
                scores[k] = scores[k] / ssum

        label = max(scores.items(), key=lambda kv: kv[1])[0]
        results.append({
            "premise": inp["text"],
            "hypothesis": inp["text_pair"],
            "label": label,
            "scores": scores
        })
    return results

def compute_persona_scores(premises: List[str], answer_text: str, nli, id2label=None) -> Dict:
    """
    Implements the paper’s metric:

    Steps:
      - Split answer into hypothesis sentences.
      - For each hypothesis, run NLI against every persona premise.
      - E = elimination rate (fraction of hypotheses with at least one ENT)
      - C = contradiction rate (fraction of hypotheses with at least one CONTR)
      - Score = max(0, 1 - C) * (0.5 + 0.5 * E)
    """
    hypotheses = split_answer_to_hypotheses(answer_text)
    # hypotheses = [answer_text] if answer_text.strip() else []
    if not hypotheses:
        return {
            "hypotheses": [],
            "pairs": [],
            "E": 0.0,
            "C": 0.0,
            "score": 0.0
        }

    pairs = pairwise_nli(nli, premises, hypotheses, id2label=id2label)

    # Group by hypothesis
    by_h = defaultdict(list)
    for r in pairs:
        by_h[r["hypothesis"]].append(r)

    entail_any = 0
    contr_any = 0
    for h, recs in by_h.items():
        has_ent = any(r["label"] == "ENTAILMENT" for r in recs)
        has_contr = any(r["label"] == "CONTRADICTION" for r in recs)
        entail_any += 1 if has_ent else 0
        contr_any += 1 if has_contr else 0

    H = len(hypotheses)
    E = entail_any / H
    C = contr_any / H
    score = max(0.0, 1.0 - C) * (0.5 + 0.5 * E)

    return {
        "hypotheses": hypotheses,
        "pairs": pairs,
        "E": E,
        "C": C,
        "score": score
    }

def main():
    ap = argparse.ArgumentParser(description="Persona-NLI Consistency Score")
    ap.add_argument("--pipeline_json", required=True,
                    help="Path to JSON with Unified Evaluation Pipeline fields. Must include 'persona_premises'.")
    ap.add_argument("--answers_json", required=True,
                    help="Path to JSON with answers list: {'answers': [{'id': '...', 'text': '...'}]}")
    ap.add_argument("--model", default="roberta-large-mnli",
                    help="HF model name. E.g., roberta-large-mnli or microsoft/deberta-v3-large-mnli")
    ap.add_argument("--out", required=True, help="Path to write report JSON.")
    args = ap.parse_args()

    with open(args.pipeline_json, "r", encoding="utf-8") as f:
        pipe_cfg = json.load(f)
    with open(args.answers_json, "r", encoding="utf-8") as f:
        answers = json.load(f)

    premises = pipe_cfg.get("persona_premises", [])
    if not isinstance(premises, list) or not premises:
        raise ValueError("pipeline_json must contain non-empty 'persona_premises' list per Unified Evaluation Pipeline.")

    nli, id2label = load_pipeline(args.model)

    report = {
        "model": args.model,
        "persona_premises": premises,
        "results": []
    }

    for item in answers.get("answers", []):
        ans_id = item.get("id", "")
        text = item.get("text", "") or ""
        res = compute_persona_scores(premises, text, nli, id2label=id2label)
        report["results"].append({
            "id": ans_id,
            "E": res["E"],
            "C": res["C"],
            "score": res["score"],
            "hypotheses": res["hypotheses"],
            "pairwise": res["pairs"]
        })

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()

# python Benchmark/NLI/persona_nli.py --pipeline_json Benchmark/NLI/pipeline.json --answers_json Benchmark/NLI/answers.json --model roberta-large-mnli --out Benchmark/NLI/persona_report.json