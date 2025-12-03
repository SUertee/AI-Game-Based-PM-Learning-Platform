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
  # --- In-style (1) ---
  "Quick hypothesis: we can hit the date if we trim scope by 10%. I'll publish the cut list and owners after stand-up.",
  "I'm calm on the slip risk. Two levers: add two contractors, or drop noncritical analytics. Which do you prefer?",
  "Sharing the numbers: P95 is 310 ms vs target 250. I propose payload trimming and edge cache. Objections?",
  "Let's whiteboard options for 15 minutes, then decide. I'll document the trade-offs and post the notes.",
  "I hear the concern. What's the must-have outcome by Friday? I'll map deliverables to that and expose gaps.",
  "Transparent update: budget burn is 84% with 70% scope done. I recommend pausing the chatbot spike.",
  "I'm proposing a feature flag with a rollback plan. We test on 10% traffic and review metrics at 4 pm.",
  "Curious point—what problem are we actually solving? If it's retention, can we validate with a small A/B?",
  "Concrete next step: create a one-pager with risks, costs, and owners. I'll circulate for comments by EOD.",
  "I can take the hot seat on the deadline. Decision now: descope settings v2 to protect onboarding flow.",
  "Let's run a quick premortem. Top three failure modes, then countermeasures. I'll synthesize and share.",
  "Data check: events coverage is 78%. We need 85% minimum. I'll pair with data to close the gap today.",
  "Open question: do we optimize for DAU or first-week retention? Different choices; I'll outline impacts.",
  "I'm friendly to alternatives. If you have a leaner plan, pitch it in five minutes—timer starts now.",
  "No surprises: I'm posting the risk log and red items in the channel after this meeting.",
  "I'll host a 20-minute office hour later. Bring blockers; I'll route to the right owners on the spot.",
  "Let's stress-test the assumption that infra is the bottleneck. Quick benchmark, then decide.",
  "I'm decisive here: we keep the launch date, move recommendations to a controlled pilot post-GA.",
  "I'll speak with Legal now and report back in writing. No hallway deals.",
  "I appreciate the pushback. Show me two data points and I'll change my mind.",
  "I'm adding acceptance criteria in plain language so everyone can verify outcomes.",
  "We can debate, but we end with a decision. I'll record it and the rationale in the doc.",
  "Friendly ask: keep critiques specific and actionable. I'll do the same.",
  "I'll run the meeting on timeboxes. If we drift, I'll park items and follow up async.",
  "Numbers first: forecast says we're +6 days. My call is to cut scope, not extend.",
  "I'll surface the constraint: design bandwidth is the choke point. We re-sequence dev accordingly.",
  "If we add this, what do we remove? I need a name and an owner before I say yes.",
  "I'm fine being accountable. If this choice backfires, it's on me. Let's move.",
  "Let's get the right people in the room: product, data, and eng. No spectators.",
  "I'll post a Loom with the walkthrough so folks who missed the meeting can react.",
  "Here's the doc with options A/B/C, costs, risks, and my recommendation. Comment inline.",
  "I'll translate the jargon. If it's unclear, that's on me, not you.",
  "I'm keeping us honest: if we don't measure it next week, it doesn't count.",
  "Small bet first. If it works, we double down; if not, we stop cleanly.",
  "I'll take the debate offline after we choose. Decision now: A.",
  "We can be kind and candid. I'll start: I missed yesterday's review; fixing that.",
  "I'm scheduling a mid-sprint check. If trend is negative, I'll trigger the fallback plan.",
  "I'm publishing the raw data and my spreadsheet so anyone can audit the math.",
  "Let's turn disagreement into tests. Two variants, one metric, one week.",
  "I'll rotate facilitation next time so more voices lead.",
  "Scope creep flagged. I'll log it, price it, and ask the sponsor to approve or defer.",
  "We're not stuck; we're uncertain. I'm running a 1-day spike to learn cheaply.",
  "I choose clarity over speed here. Ten extra minutes now saves us days later.",
  "Polite but firm: we stop changing requirements today. New asks go to the next release.",
  "I'll summarize in three bullets and a date. If I missed something, correct me publicly.",
  "Thanks for raising risk early. I'm assigning an owner and due date right now.",

  # --- Not in-style (0): vague, opaque, indecisive, reactive, non-transparent, melodramatic ---
  "Let's not share numbers; it might worry people.",
  "We'll see what happens and decide later.",
  "I don't want to pick; someone else choose.",
  "This is a disaster; everything is broken.",
  "Let's keep this change quiet to avoid pushback.",
  "I feel the metrics are fine even without data.",
  "We can promise both features and sort it out next week.",
  "No need to document; everyone remembers.",
  "Let's cancel the meeting and hope the problem fades.",
  "It's not my decision; ask someone else.",
  "I don't want feedback on the plan; it's set.",
  "Let's delay the bad news until launch day.",
  "I prefer we extend the deadline indefinitely.",
  "I can't explain the choice; just trust me.",
  "Please stop questioning; it slows us down.",
  "I'm too busy to write any notes or updates.",
  "Let's avoid conflict and approve everything.",
  "We should wait for perfect information.",
  "I'll decide tomorrow, or maybe next week.",
  "Don't share the risk list; it looks bad.",
  "I won't commit to a date or a scope.",
  "Let's ignore the budget and keep building.",
  "I'd rather not involve Legal or Finance.",
  "We'll figure out ownership later.",
  "Let's not measure this; gut feel is enough."
]

y = np.array([1]*46 + [0]*25, dtype=int)

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

with open("Benchmark/Style_Adherence/Persona1/style_eval.json", "w") as f:
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
dump(cal_full, "Benchmark/Style_Adherence/Persona1/style_clf.joblib")
meta = {
    "emb_name": EMB_NAME,
    "normalize": NORMALIZE,
    "threshold": THRESH,            # your production decision threshold
    "labels": {"neg": 0, "pos": 1},
    "training": eval_report,        # keep eval for traceability
}
with open("Benchmark/Style_Adherence/Persona1/style_meta.json", "w") as f:
    json.dump(meta, f, indent=2)

# ==== INFERENCE HELPERS ====
def style_score(text: str) -> float:
    v = emb.encode([text], normalize_embeddings=NORMALIZE)
    return float(cal_full.predict_proba(v)[:, 1][0])

def style_label(text: str) -> int:
    return int(style_score(text) >= THRESH)
