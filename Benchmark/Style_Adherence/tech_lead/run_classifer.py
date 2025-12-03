from sentence_transformers import SentenceTransformer
from joblib import load
import json
import numpy as np

def load_model():   
    with open("Benchmark/Style_Adherence/tech_lead/style_meta.json") as f: meta = json.load(f)
    emb = SentenceTransformer(meta["emb_name"])
    clf = load("Benchmark/Style_Adherence/tech_lead/style_clf.joblib")
    return clf, emb, meta

clf, emb, meta = load_model()

def style_score(text: str) -> float:
    """
    Input: one sentence.
    Output: float in [0,1]. This is the probability that text is “in-style”.
    """
    v = emb.encode([text], normalize_embeddings=meta["normalize"])
    return float(clf.predict_proba(v)[:,1][0])

def style_label(text: str) -> int:
    p = style_score(text)
    return int(p >= meta["threshold"])  # 1=in-style, 0=not

# batch
def style_scores(texts):
    V = emb.encode(texts, normalize_embeddings=meta["normalize"])
    return clf.predict_proba(V)[:,1]

print(style_score("Please confirm your preference by EOD tomorrow so I can formalize the change request or lock scope."))
print(style_label("You ain gonna do that? I thought we need it?"))
print(style_scores(["Are you not going to do that? I thought we needed it.","I did plan to do that, but changed my mind."]))

print(style_scores(["I get the excitement, but we can’t just slip this in.",
  "With 4 weeks left, zero contingency, and $150k remaining, any new scope needs sponsor approval and an impact assessment.",
  " I’ll run a 48‑hour analysis with engineering: effort, cost, architectural risk, and impact on launch.", 
  "Options: defer AI to a post-launch phase with a clear ROI case, or do a lightweight, non-blocking pilot behind a feature flag using a rules-based placeholder.",
  "I’ll set a short meeting with the stakeholder and sponsor to decide based on data."]))
