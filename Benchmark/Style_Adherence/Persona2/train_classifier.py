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


# Label: 1 = INTP • Analytical • Problem-solver • autonomous yet open to input • full-stack, clean code, innovation
#        0 = not-in-style

texts = [
  # --- In-style (1) ---
  "Hypothesis: the bottleneck is JSON parsing, not I/O; I'll profile with py-spy and confirm.",
  "I prefer a minimal surface API; smaller contracts reduce coupling and cognitive load.",
  "Before we pick a framework, what are the invariants? I'll list them and test against options.",
  "I'll prototype the data flow with a small slice end-to-end to expose hidden complexity.",
  "Let's replace the ad-hoc regex with a parser combinator; fewer edge cases, clearer intent.",
  "I can implement this as a pure function first and wrap side effects at the boundary.",
  "I'm adding property-based tests; they find cases we won't think of.",
  "Strong case for keyset pagination; I'll write a note and benchmark both on our dataset.",
  "I'll refactor toward ports-and-adapters so the domain stays independent of the framework.",
  "We can remove 30% of code by composing the existing primitives; I'll draft the patch.",
  "I want a typed client for the API; Zod/TypeBox on the wire, TS types in the app.",
  "I'll isolate date math into a module with invariants; DST bugs belong there, not everywhere.",
  "Let's verify performance claims: I'll write a micro-benchmark and include variance.",
  "The algorithm is O(n²); I'll try a sweep-line approach for O(n log n).",
  "I'd like to pair for 30 minutes to stress-test the approach, then I'll run solo.",
  "I'll document design trade-offs as ADRs; reversible decisions go first.",
  "We can't cache effectively without idempotence; I'll add request keys.",
  "I'll propose a small DSL for queries; safer than string concatenation.",
  "The UI jank comes from layout thrashing; I'll batch reads and writes.",
  "Let's add a feature toggle so we can iterate without blocking release.",
  "I'll sketch the schema with examples and counterexamples; then code.",
  "Prefer composition to inheritance here; we only need two behaviors.",
  "I'll expose a pure core for unit tests and a thin integration layer.",
  "I'm adding static analysis rules to prevent accidental any and implicit any.",
  "I'll measure cold vs warm start separately; they require different fixes.",
  "The retry policy lacks backoff; I'll add exponential with jitter and a cap.",
  "I'll replace the custom observable with a standard async generator.",
  "We should make failures loud; I'll add guards and explicit error types.",
  "I'll try a small heuristic first; ML can wait until we beat the baseline.",
  "I'll codemod the API rename to keep diffs mechanical and reviewable.",
  "Let's target clarity: shorter functions, fewer branches, better names.",
  "I'll create a reproducible dev container; same toolchain for everyone.",
  "I prefer lint rules to PR debates; we can encode the style once.",
  "I'll validate input at the edges and trust internally; cheaper and safer.",
  "Let's write an executable spec; examples double as tests and docs.",
  "I'd like a brief async review; I'll respond to comments tomorrow morning.",
  "I'll spike WebAssembly for the hot loop; if no gain, we drop it.",
  "I'm fine working independently; share constraints and I'll post a plan.",
  "If someone has a simpler model, I'll adopt it; I care about the proof, not authorship.",
  "I'll add telemetry around the hypothesis so we learn even if we're wrong.",

  # --- Not in-style (0) ---
  "Let's just copy the code from a tutorial and hope it fits.",
  "I don't need benchmarks; it feels fast on my laptop.",
  "Skip tests to move faster; we can add them next quarter.",
  "Let's pick the coolest framework because it's trending.",
  "I'd rather not explain design choices; just trust me.",
  "We don't need types; dynamic is more fun.",
  "If it crashes, we'll restart and see.",
  "Documentation slows me down; I'll skip it.",
  "Merge to main without review; it's fine.",
  "Hardcode secrets for now and fix later.",
  "Open CORS to everyone so it works everywhere.",
  "Performance tuning is premature; never profile.",
  "Let's deploy Friday night; it's quieter.",
  "Accessibility can wait; not many users need it.",
  "Copy prod data to local machines for quick debugging.",
  "Turn off linting; the warnings are annoying.",
  "Ship with console.log everywhere; we'll clean later.",
  "Use global state for convenience; we can refactor someday.",
  "We should avoid refactors; they don't show visible progress.",
  "Pick the biggest instance size; cheaper than thinking.",
  "Keep all logic in one file so it's easy to find.",
  "We don't need error handling; happy path only.",
  "Let's ignore code style; everyone does their own.",
  "Privacy is a legal issue, not engineering's problem."
]

y = np.array([1]*40 + [0]*24, dtype=int)


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

with open("Benchmark/Style_Adherence/Persona2/style_eval.json", "w") as f:
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
dump(cal_full, "Benchmark/Style_Adherence/Persona2/style_clf.joblib")
meta = {
    "emb_name": EMB_NAME,
    "normalize": NORMALIZE,
    "threshold": THRESH,            # your production decision threshold
    "labels": {"neg": 0, "pos": 1},
    "training": eval_report,        # keep eval for traceability
}
with open("Benchmark/Style_Adherence/Persona2/style_meta.json", "w") as f:
    json.dump(meta, f, indent=2)

# ==== INFERENCE HELPERS ====
def style_score(text: str) -> float:
    v = emb.encode([text], normalize_embeddings=NORMALIZE)
    return float(cal_full.predict_proba(v)[:, 1][0])

def style_label(text: str) -> int:
    return int(style_score(text) >= THRESH)
