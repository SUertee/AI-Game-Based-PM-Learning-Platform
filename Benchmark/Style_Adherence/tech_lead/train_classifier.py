# pip install sentence-transformers scikit-learn joblib numpy
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score, average_precision_score, accuracy_score, f1_score,
    precision_recall_fscore_support, brier_score_loss, confusion_matrix
)
from joblib import dump
import numpy as np, json, time

# ==== DATA ====
import numpy as np

texts = [
  # --- Technical Lead style (1) ---
  "Let's keep GA safe: ship the feature behind a flag and plan a one-click rollback.",
  "Before we commit, can we agree on the API shape and versioning? I want to avoid a silent breaking change.",
  "I'm targeting P95 under 250 ms on reads; if we miss that, we trim payloads or cache.",
  "Please add idempotency keys to POST /orders so retries don't double-charge users.",
  "I'll write a short ADR comparing SQS vs Kafka on ordering and throughput; we can decide in stand-up.",
  "This schema change needs a backward-compatible path. Let's dual-write for one release.",
  "Can we turn on structured logging and trace IDs so we can follow a request across services?",
  "Downstream is flaky today. Add bounded retries with jitter and a circuit breaker.",
  "Hot paths should be cached for 60 seconds. Let's also add stampede protection.",
  "I'd like an availability SLO at 99.9% with an error budget. We'll alert on fast burn.",
  "Auth needs short-lived JWTs plus a refresh flow. RBAC checks live in the service layer.",
  "Before launch, run load to 2× expected QPS and capture heap and GC metrics.",
  "Offset pagination is causing latency spikes. Switch to keyset pagination, please.",
  "Treat PII carefully: encrypt at rest and in transit, and rotate keys on a schedule.",
  "I'm drafting an on-call runbook with dashboards and first-response steps.",
  "Add a unique index on handles and use a deadlock-safe upsert.",
  "We're queueing too much work. Add backpressure and reject when the queue crosses the limit.",
  "Let's split reads from writes. Replica lag needs to stay under two seconds.",
  "Use protobuf with compatibility checks in CI so we don't break consumers.",
  "We'll do a blue/green deploy with a 10% canary and auto-rollback on SLO breach.",
  "CI should fail if unit, integration (Testcontainers), or the security scan fails.",
  "Move secrets to the vault. I want plaintext env files out of the repo.",
  "Please set CPU/memory requests and limits. Enable HPA on CPU and our latency metric.",
  "Add timeouts on the critical path at 300 ms and log slow calls so we see hotspots.",
  "Let's publish domain events for order updates and use the outbox pattern to avoid drops.",
  "Document ownership: service, on-call, and SLOs in the README so support knows who to page.",
  "I'd like to refactor toward hexagonal architecture to isolate infrastructure concerns.",
  "Add simple invariants around the transaction so we fail fast on inconsistent states.",
  "Schedule a chaos test for the payments dependency; we should degrade gracefully.",
  "We need a data retention note and a GDPR erase flow. I'll add the deletion job spec.",
  "Cron is brittle. Can we move to event-driven scheduling to cut cold starts?",
  "Use optimistic locking with a version column; surface conflict errors cleanly.",
  "Rate-limit by API key and return 429 with Retry-After so clients can back off.",
  "Let's add synthetic checks from three regions and alert on TLS expiry a week early.",
  "I profiled the handler. The N+1 query is the culprit; switch to eager loading.",
  "Please pin dependencies and add provenance in the build. It saves us from surprise upgrades.",
  "Precompute aggregates into a materialized view and refresh every five minutes.",
  "Our SLIs are availability, latency, and correctness. We'll review them weekly.",
  # --- Not Technical Lead style (0) ---
  "Let's make the app feel cooler with brighter colors everywhere.",
  "We can ship now and fix problems later if users complain.",
  "Marketing wants something flashy; just enable it for everyone.",
  "I don't need the technical details; the team will handle it.",
  "Skip tests this week so we can move faster.",
  "Security is a later problem once we grow.",
  "Performance seems fine; nobody has raised an issue.",
  "Remove the logs; they clutter the console.",
  "We'll figure out the API once the UI is done.",
  "Let's merge to main directly to save time.",
  "If it crashes, we can just restart the server.",
  "Metrics are overkill; trust your instincts.",
  "Friday night deploy is fine; the weekend is quiet.",
  "Privacy slows us down; legal can catch up later.",
  "Pick whatever library is trending right now.",
  "Just scale up the instance; profiling is a waste.",
  "Hardcode the credentials for now and fix later.",
  "Copy that code from a blog; we don't need credits.",
  "Delete the failing tests so CI passes.",
  "Turn off type checks; they're slowing us down.",
  "Only show the first page; pagination is confusing.",
  "Open CORS to everyone so partners don't complain.",
  "Ship without monitoring; we can add it after launch.",
  "Turn off HTTPS in prod to simplify things."
]

y = np.array(
  [1]*38 + [0]*24,
  dtype=int
)

EMB_NAME = "all-mpnet-base-v2"
NORMALIZE = True
THRESH = 0.75

# ==== EMBEDDINGS ====
emb = SentenceTransformer(EMB_NAME)
X = emb.encode(texts, normalize_embeddings=NORMALIZE)

# ==== SPLIT ====
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# ==== MODEL + CALIBRATION (train on train, evaluate on test) ====
base = LogisticRegression(
    solver="lbfgs", C=1.0, class_weight="balanced", max_iter=2000
)
cal = CalibratedClassifierCV(base, method="isotonic", cv=3)
t0 = time.time(); cal.fit(X_tr, y_tr); train_sec = time.time() - t0

p_te = cal.predict_proba(X_te)[:, 1]
y_hat = (p_te >= 0.5).astype(int)  # neutral 0.5 cut; decision thresholding can use THRESH later

# ==== METRICS ====
def expected_calibration_error(y_true, y_prob, n_bins=15):
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    idx = np.digitize(y_prob, bins) - 1
    ece = 0.0; total = len(y_true)
    for b in range(n_bins):
        mask = idx == b
        if not np.any(mask): 
            continue
        conf = y_prob[mask].mean()
        acc = y_true[mask].mean()
        ece += (mask.sum()/total) * abs(acc - conf)
    return float(ece)

auc = roc_auc_score(y_te, p_te)
aupr = average_precision_score(y_te, p_te)
acc = accuracy_score(y_te, y_hat)
prec, rec, f1, _ = precision_recall_fscore_support(y_te, y_hat, average="binary", zero_division=0)
brier = brier_score_loss(y_te, p_te)
ece = expected_calibration_error(y_te, p_te, n_bins=15)
cm = confusion_matrix(y_te, y_hat).tolist()

prob_true, prob_pred = calibration_curve(y_te, p_te, n_bins=10, strategy="quantile")

eval_report = {
    "model": "LogReg+isotonic",
    "embedding": EMB_NAME,
    "normalize": NORMALIZE,
    "train_seconds": round(train_sec, 3),
    "test_size": int(len(y_te)),
    "metrics": {
        "auc": round(float(auc), 4),
        "aupr": round(float(aupr), 4),
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1": round(float(f1), 4),
        "brier": round(float(brier), 4),
        "ece": round(float(ece), 4),
        "confusion_matrix": cm,
        "calibration_bins": {
            "pred_mean": [round(float(x),4) for x in prob_pred],
            "true_mean": [round(float(x),4) for x in prob_true],
        },
    },
}

with open("Benchmark/Style_Adherence/tech_lead/style_eval.json", "w") as f:
    json.dump(eval_report, f, indent=2)

print("AUC:", auc, "F1:", f1, "ECE:", ece)

# ==== REFIT ON ALL DATA FOR DEPLOYMENT ====
cal_full = CalibratedClassifierCV(
    LogisticRegression(solver="lbfgs", C=1.0, class_weight="balanced", max_iter=2000),
    method="isotonic",
    cv=3,
).fit(X, y)

# ==== SAVE ARTIFACTS ====
from joblib import dump
dump(cal_full, "Benchmark/Style_Adherence/tech_lead/style_clf.joblib")
meta = {
    "emb_name": EMB_NAME,
    "normalize": NORMALIZE,
    "threshold": THRESH,            # your production decision threshold
    "labels": {"neg": 0, "pos": 1},
    "training": eval_report,        # keep eval for traceability
}
with open("Benchmark/Style_Adherence/tech_lead/style_meta.json", "w") as f:
    json.dump(meta, f, indent=2)

# ==== INFERENCE HELPERS ====
def style_score(text: str) -> float:
    v = emb.encode([text], normalize_embeddings=NORMALIZE)
    return float(cal_full.predict_proba(v)[:, 1][0])

def style_label(text: str) -> int:
    return int(style_score(text) >= THRESH)
