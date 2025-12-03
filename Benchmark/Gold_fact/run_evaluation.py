from __future__ import annotations
import re
import json
import argparse
from dataclasses import dataclass
from typing import List, Dict, Tuple

# -----------------------------
# Normalization (SQuAD-inspired)
# -----------------------------
"""
1. Split gold facts and reply into sentences.
Purpose: treat each gold fact as a unit to check; compare each gold sentence against the reply sentences. Simple regex segmentation is sufficient for controlled texts. 

2. Normalize text.
Lowercase, remove punctuation, drop English articles, squeeze spaces.
Purpose: match SQuAD evaluation’s “normalize_answer” so trivial surface differences do not affect scoring. 

3.Tokenize.
Split normalized strings into tokens.
Purpose: enable token-overlap scoring used by SQuAD-style F1. 

4.Per-fact best match.
For each gold sentence, compute overlap with every reply sentence and keep the highest-F1 pair.
Purpose: mirrors QA evaluation where an answer is credited against its best matching span/sentence, reducing penalty when the reply restates facts once. 


5.Token-level precision, recall, F1.
Compute overlap counts, then precision = overlap/|pred|, recall = overlap/|gold|, F1 = 2PR/(P+R).
Purpose: give partial credit for paraphrases that share content words; standard in QA and IE metrics. 


6.Exact Match (EM).
After normalization, EM = 1 if a gold sentence equals its best-matched reply sentence, else 0.
Purpose: strict correctness signal, complementary to F1’s partial credit; standard SQuAD metric. 

7.Aggregate.
EM = mean over gold sentences. Macro-F1 = mean of best-match F1 over gold sentences.
Purpose: treat each gold fact equally; yields a 0–1 factuality score compatible with dashboards
Token-overlap F1 rewards semantic alignment when wording differs, while EM guards against over-crediting loose paraphrases. Using both gives a balanced view. 

Limitations to note:
Overlap F1 does not verify truth against external evidence; it only measures agreement with gold text. For KB-based checks, pair retrieval with NLI.Here are the steps your script uses, with purpose and sources.
"""

"""
To run:
python Benchmark/Gold_fact/run_evaluation.py \
  --gold Benchmark/Gold_fact/gold_fact.txt \
  --reply Benchmark/Gold_fact/reply.txt \
  --from_files --json
"""


_ARTICLES = {"a", "an", "the"}
_PUNCT_RE = re.compile(r"[^\w\s]")
_WS_RE = re.compile(r"\s+")

def normalize_text(s: str) -> str:
    """Lower, remove punctuation, drop articles, squeeze spaces."""
    s = s.lower()
    s = _PUNCT_RE.sub(" ", s)
    tokens = [t for t in _WS_RE.sub(" ", s).strip().split(" ") if t]
    tokens = [t for t in tokens if t not in _ARTICLES]
    # print(" ".join(tokens))
    return " ".join(tokens)

def tokenize(s: str) -> List[str]:
    s_norm = normalize_text(s)
    return s_norm.split() if s_norm else []

# -----------------------------
# Sentence segmentation (naive)
# -----------------------------

_SENT_SPLIT_RE = re.compile(r"(?<=[\.!?;])\s+|\n+")

def split_into_sentences(text: str) -> List[str]:
    # Keep simple. Filter very short segments.
    parts = [p.strip() for p in _SENT_SPLIT_RE.split(text) if p and p.strip()]
    return [p for p in parts if len(p) >= 2]

# -----------------------------
# F1 utilities (token overlap)
# -----------------------------

def token_f1(gold: List[str], pred: List[str]) -> float:
    if not gold and not pred:
        return 1.0
    if not gold or not pred:
        return 0.0
    gold_counts: Dict[str,int] = {}
    for t in gold:
        gold_counts[t] = gold_counts.get(t, 0) + 1
    pred_counts: Dict[str,int] = {}
    for t in pred:
        pred_counts[t] = pred_counts.get(t, 0) + 1
    # overlap
    common = 0
    for t, c in pred_counts.items():
        if t in gold_counts:
            common += min(c, gold_counts[t])
    if common == 0:
        return 0.0
    precision = common / max(1, len(pred))
    recall = common / max(1, len(gold))
    return (2 * precision * recall) / (precision + recall)

def exact_match(gold: str, pred: str) -> bool:
    return normalize_text(gold) == normalize_text(pred)

# -----------------------------
# Main evaluation
# -----------------------------

@dataclass
class FactResult:
    gold_sentence: str
    best_match_sentence: str
    f1: float
    exact_match: bool

@dataclass
class EvalResult:
    em: float              # fraction of gold sentences exactly matched
    f1_macro: float        # mean F1 across gold sentences
    details: List[FactResult]

def evaluate_gold_factuality(gold_text: str, reply_text: str) -> EvalResult:
    gold_sents = split_into_sentences(gold_text)
    pred_sents = split_into_sentences(reply_text)

    if not gold_sents:
        return EvalResult(em=1.0, f1_macro=1.0, details=[])

    details: List[FactResult] = []
    em_hits = 0
    f1_sum = 0.0

    pred_tok_cache: List[Tuple[str, List[str]]] = [(s, tokenize(s)) for s in pred_sents]

    for g in gold_sents:
        g_tok = tokenize(g)
        best_f1 = 0.0
        best_sent = ""
        best_em = False
        for p_raw, p_tok in pred_tok_cache:
            f1 = token_f1(g_tok, p_tok)
            if f1 > best_f1:
                best_f1 = f1
                best_sent = p_raw
                best_em = exact_match(g, p_raw)
        if best_em:
            em_hits += 1
        f1_sum += best_f1
        details.append(FactResult(gold_sentence=g, best_match_sentence=best_sent, f1=best_f1, exact_match=best_em))

    em = em_hits / len(gold_sents)
    f1_macro = f1_sum / len(gold_sents)
    return EvalResult(em=em, f1_macro=f1_macro, details=details)

# -----------------------------
# CLI
# -----------------------------

def _result_to_dict(res: EvalResult) -> Dict:
    return {
        "em": res.em,
        "f1_macro": res.f1_macro,
        "details": [
            {
                "gold_sentence": d.gold_sentence,
                "best_match_sentence": d.best_match_sentence,
                "f1": d.f1,
                "exact_match": d.exact_match,
            }
            for d in res.details
        ],
    }

def main():
    ap = argparse.ArgumentParser(description="Gold Fact Factuality Evaluator (EM + token F1)")
    ap.add_argument("--gold", type=str, help="Path to a text file with gold facts, or inline text")
    ap.add_argument("--reply", type=str, help="Path to a text file with the reply to evaluate, or inline text")
    ap.add_argument("--from_files", action="store_true", help="Treat --gold and --reply as file paths")
    ap.add_argument("--json", action="store_true", help="Print JSON")
    args = ap.parse_args()

    if args.from_files:
        with open(args.gold, "r", encoding="utf-8") as f:
            gold_text = f.read()
        with open(args.reply, "r", encoding="utf-8") as f:
            reply_text = f.read()
    else:
        gold_text = args.gold or ""
        reply_text = args.reply or ""

    res = evaluate_gold_factuality(gold_text, reply_text)
    out = _result_to_dict(res)
    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        print(f"EM: {out['em']:.3f}")
        print(f"F1_macro: {out['f1_macro']:.3f}")
        for i, d in enumerate(out["details"], 1):
            print(f"[{i}] F1={d['f1']:.3f} EM={d['exact_match']}")
            print(f"  GOLD: {d['gold_sentence']}")
            print(f"  BEST: {d['best_match_sentence']}")

if __name__ == "__main__":
    main()
