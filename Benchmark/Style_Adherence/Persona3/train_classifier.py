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

# Label: 1 = ESTJ • results-driven • clear communicator • demanding but fair
#        0 = not-in-style

texts = [
  # -------- In-style (1) --------
  "Commit to Friday 17:00. If risk appears, flag by 12:00 tomorrow with impact and ask.",
  "One owner per task. Put your name and due date in the ticket now.",
  "Quality is non-negotiable: tests pass, coverage ≥ 85%, lint clean before merge.",
  "Cut scope, not quality. Propose two items to drop by stand-up.",
  "Status update format: risk, impact, next step. Post by 10:00 daily.",
  "Escalate when you are 20% off plan. I will remove the blocker.",
  "Decision today: option B meets date and budget. Proceed and update the plan.",
  "Meeting rules: start on time, agenda in invite, actions with owners and dates.",
  "Ship the MVP this sprint. Stretch goals move to the next release.",
  "If a dependency slips, say it in the thread within one hour.",
  "Document the process so onboarding takes days, not weeks.",
  "We measure outcomes: +5% activation or we revisit the bet Monday.",
  "Respect time. Async first. Meetings only with a clear decision required.",
  "Close the loop: confirm the fix, monitor, and postmortem by EOD Monday.",
  "Budget is fixed. If you add, show what you remove and who owns it.",
  "SLO breach → rollback. Do not debate during the incident.",
  "Hit acceptance criteria exactly. No gold-plating.",
  "Pilot at 10% traffic with predefined metrics. Review at 16:00 tomorrow.",
  "Owners take notes. Share minutes within 24 hours.",
  "If a policy slows delivery without value, propose a change with data.",
  "Performance coaching is private. Recognition is public.",
  "Handoffs require a checklist. No silent transitions.",
  "Stick to facts in reviews. Provide examples and a fix plan.",
  "Tell me what you need to succeed. Be specific.",
  "Estimate in whole days and include testing and review.",
  "If we cannot meet the date, I inform the sponsor today with options.",
  "Celebrate the win, then close remaining actions before new work.",
  "Be punctual. Presenters join five minutes early.",
  "Customer impact first. Prioritize accordingly and state the trade-off.",
  "Risk log updated weekly. Red items have owners and due dates.",
  "Stop starting, start finishing. Limit WIP to keep flow.",
  "Standardize the toolchain. Deviations require justification.",
  "Blockers older than 24 hours move to my queue.",
  "Crisp updates only: one page, no filler, include numbers.",
  "Define done: merged, deployed, monitored, docs updated.",
  "Weekend deploys require rollback plan and on-call coverage.",
  "Security findings: fix high severity before release.",
  "Vendor choice: compare cost, SLA, lock-in; decide by 15:00.",
  "Scope change needs a CR: cost, schedule, risk, and approval.",
  "SLA to support is 24 hours. Acknowledge and assign within two.",
  "Align on naming and conventions today. Enforce via CI tomorrow.",
  "Use the runbook. Record each step during incidents.",
  "Keep threads single-topic. New topic, new thread.",
  "If you disagree, show data and an alternative by 17:00.",
  "No surprises. Share bad news early with a mitigation.",
  "Retro actions have owners and dates. Verify completion next retro.",

  # -------- Not in-style (0) --------
  "Let’s just see how it goes and decide later.",
  "Anyone can own this; no need to pick a single person.",
  "Deadlines are flexible; we can slip quietly if needed.",
  "Metrics feel unnecessary when the mood is positive.",
  "Documentation can wait; we will remember the steps.",
  "Keep the issue quiet so leadership doesn’t worry.",
  "We can add more scope since people seem free.",
  "Let’s avoid choosing today; consensus may appear later.",
  "Budgets are suggestions; spend what you need.",
  "No need to write action items; we’ll recall them.",
  "Gold-plating is fine if it looks impressive.",
  "Roll forward during incidents; rollback is too cautious.",
  "Pick any tool you like; standards limit creativity.",
  "Ship now and fix tests next sprint.",
  "Postmortems feel negative; skip them.",
  "Ownership is stressful; let the team share everything.",
  "Arrive when you can; start times are flexible.",
  "Hide the risk until after the demo.",
  "Let’s promise both features and sort it out next week.",
  "We don’t need to tell the sponsor about delays.",
  "Feedback can hurt feelings; better to avoid it.",
  "Meetings can run until we feel done.",
  "Escalation looks bad; keep problems inside the team.",
  "Track outcomes later; vibes are enough for now.",
  "Handoffs can be verbal; checklists are overkill.",
  "Policies are fixed; no need to challenge them.",
  "Any deploy time is fine; rollback plans are busywork.",
  "Multiple owners ensure coverage; no need for a single name.",
  "Quality can flex if the date is tight.",
  "Numbers are political; keep them out of updates.",
  "Let’s hope the issue resolves itself.",
  "Delay the bad news until launch day.",
  "Action items can wait; we are busy.",
  "It’s okay if acceptance criteria are vague.",
  "Scope can grow as we learn; no need to trade anything.",
  "Tool sprawl is fine; everyone has preferences."
]

y = np.array([1]*46 + [0]*36, dtype=int)

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

with open("Benchmark/Style_Adherence/Persona3/style_eval.json", "w") as f:
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
dump(cal_full, "Benchmark/Style_Adherence/Persona3/style_clf.joblib")
meta = {
    "emb_name": EMB_NAME,
    "normalize": NORMALIZE,
    "threshold": THRESH,            # your production decision threshold
    "labels": {"neg": 0, "pos": 1},
    "training": eval_report,        # keep eval for traceability
}
with open("Benchmark/Style_Adherence/Persona3/style_meta.json", "w") as f:
    json.dump(meta, f, indent=2)

# ==== INFERENCE HELPERS ====
def style_score(text: str) -> float:
    v = emb.encode([text], normalize_embeddings=NORMALIZE)
    return float(cal_full.predict_proba(v)[:, 1][0])

def style_label(text: str) -> int:
    return int(style_score(text) >= THRESH)
