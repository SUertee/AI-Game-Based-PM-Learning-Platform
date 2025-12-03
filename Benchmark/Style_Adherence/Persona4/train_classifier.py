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

# Label: 1 = ISTJ • methodical • quality-focused • thorough • skeptical but fair
#        0 = not-in-style

texts = [
  # --- In-style (1) ---
  "I’ll follow the SOP step by step and attach screenshots as evidence.",
  "Please link the requirement ID in the PR; I need traceability.",
  "Ambiguity noted. I proposed explicit acceptance criteria in the ticket.",
  "Edge cases listed: empty, null, max length, unicode. Tests added.",
  "Rollback verified on staging; command history is in the runbook.",
  "I cross-checked dashboard metrics with the raw query; numbers match.",
  "Version bump documented; changelog updated with impact notes.",
  "Bug reproduced with a minimal script; steps are in the issue.",
  "Admin actions now emit audit logs with user, time, and payload hash.",
  "Config parity check passed across envs; diff report attached.",
  "Baseline snapshot stored; compare run shows only expected deltas.",
  "Risk: duplicate writes on retry. Idempotency token implemented and tested.",
  "Pre-commit formatting and lint rules enabled across the repo.",
  "Third-party licenses reviewed; incompatible ones replaced.",
  "Outdated procedure corrected; reviewers pinged for sign-off.",
  "Inputs validated at boundaries; outputs sanitized and typed.",
  "Failure modes enumerated with monitors and alerts for each.",
  "Timeout change justified; SLO budget remains intact.",
  "Forward and backward migrations tested; checksums recorded.",
  "Ledger totals reconciled; discrepancy was rounding—fixed.",
  "We do not bypass gates; all checks must pass before merge.",
  "Nightly job verifies backups and posts results to #ops.",
  "Evidence of fix attached: failing test now green with run IDs.",
  "Reproducibility confirmed inside a clean container image.",
  "Refactor separated from behavior change to keep review clear.",
  "Verification checklist added to the PR template.",
  "Vendor SLA thresholds wired to alerts two days before breach.",
  "README-first created with setup, pitfalls, and rollback steps.",
  "High-severity CVE patched and regression tests rerun.",
  "Post-deploy metrics within control limits; no regression.",
  "Integer boundaries tested; no overflow or wraparound.",
  "Incident timeline reconstructed from logs; minutes filed.",
  "Precedent documented; deviation rationale recorded.",
  "Release artifacts signed and immutable; tags pushed.",
  "Locale formatting tests added for dates and currency.",
  "Reporter notified with root cause and fix link.",
  "DR restore tested; RTO met; evidence attached.",
  "Unowned items flagged and assigned accountable owners.",
  "Shortcut declined; compliant alternative proposed and accepted.",
  "Meeting minutes published with owners and due dates.",
  "Pagination validated at first, last, and boundary pages.",
  "Coverage report includes nominal, boundary, and failure paths.",
  "Second reviewer requested for changes touching payments.",

  # --- Not in-style (0) ---
  "Let’s skip the SOP; it’s faster if we improvise.",
  "We can merge without tests since it looks fine.",
  "Rollback plan is unnecessary; this change is safe.",
  "I didn’t read the spec; I’ll guess the intent.",
  "Edge cases are rare; no need to test them.",
  "Docs slow me down; I’ll write them later.",
  "Prod logs are noisy; I disabled them.",
  "Monitoring can wait until after launch.",
  "I tweaked the prod schema directly to save time.",
  "Approvals are overkill for small edits.",
  "It works on my machine; no repro needed.",
  "Friday night deploy is fine; fewer eyes.",
  "The numbers look okay; skip query verification.",
  "Backups exist; restores will be fine if needed.",
  "I deleted failing tests so CI is green.",
  "Security patches can wait until next quarter.",
  "I force-pushed main to clean history.",
  "Multiple owners are fine; someone will handle it.",
  "The SOP is outdated; ignore it for now.",
  "Collect all user data first; privacy later.",
  "Hardcode credentials and fix secrets later.",
  "Alerts were noisy; I muted them in prod.",
  "License checks are optional; it compiles.",
  "Gold-plate a bit; quality means more features.",
  "Skip review; the change is obvious.",
  "Manual testing is enough for this feature.",
  "I changed prod config without recording it.",
  "No need to measure; it feels faster.",
  "Accessibility is optional; skip those tests.",
  "Decide by vibe; metrics are political.",
  "Minutes are busywork; we remember decisions.",
  "If backup fails, we’ll deal with it then.",
  "Keep risks quiet to avoid panic.",
  "Ignore canary results and roll forward.",
  "Runbook updates can wait.",
  "Standards constrain creativity; do whatever works.",
  "Removed the feature flag to speed rollout.",
  "HTTPS complicates debugging; turned it off.",
  "Copied prod data to my laptop for convenience.",
  "Skipped code review to keep velocity high."
]

y = np.array([1]*42 + [0]*41, dtype=int)


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

with open("Benchmark/Style_Adherence/Persona4/style_eval.json", "w") as f:
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
dump(cal_full, "Benchmark/Style_Adherence/Persona4/style_clf.joblib")
meta = {
    "emb_name": EMB_NAME,
    "normalize": NORMALIZE,
    "threshold": THRESH,            # your production decision threshold
    "labels": {"neg": 0, "pos": 1},
    "training": eval_report,        # keep eval for traceability
}
with open("Benchmark/Style_Adherence/Persona4/style_meta.json", "w") as f:
    json.dump(meta, f, indent=2)

# ==== INFERENCE HELPERS ====
def style_score(text: str) -> float:
    v = emb.encode([text], normalize_embeddings=NORMALIZE)
    return float(cal_full.predict_proba(v)[:, 1][0])

def style_label(text: str) -> int:
    return int(style_score(text) >= THRESH)
