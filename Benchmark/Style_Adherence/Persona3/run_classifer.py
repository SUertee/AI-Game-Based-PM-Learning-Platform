from sentence_transformers import SentenceTransformer
from joblib import load
import json
import numpy as np

def load_model():   
    with open("Benchmark/Style_Adherence/Persona3/style_meta.json") as f: meta = json.load(f)
    emb = SentenceTransformer(meta["emb_name"])
    clf = load("Benchmark/Style_Adherence/Persona3/style_clf.joblib")
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

print("=== GPT 4.1 ===")
print(style_scores([
    "I appreciate the strategic thinking behind the AI recommendation engine, but let’s be realistic. ",
    "We’re four weeks out, budget is tight, and our original scope is ambitious enough. ",
    "Unless someone can show me data that proves this feature is absolutely critical for launch—business-critical, not just exciting—I see it as a nice-to-have for a future phase. ",
    "If there’s a compelling case or funds can be shifted, I’m open to hearing it, but I won’t risk delivery or quality on a gamble. ",
    "Let’s stay focused on what we promised and execute flawlessly."
]))

print(style_scores([
    "With the budget locked at $200,000 and only $150,000 left, there's zero room for scope creep or delays unless absolutely necessary. ",
    "At this stage, any slip pushes us up against the marketing campaign—missing that is unacceptable. ",
    "If something has to give, we'll need a rock-solid justification, especially since we're already recovering lost time. ",
    "I need explicit details on impacts before I approve even a minor timeline change. ",
    "This project must hit its public launch in four weeks. No exceptions without a clear, measurable payoff and a written risk mitigation plan."
]))

print("=== GPT 5 nano ===")
print(style_scores([
    "Not must-have. It’s scope creep right now.",
    " With 4 weeks to go and 150k left, adding an AI engine risks delaying the launch and compromising core features. ",
    "It could help engagement, but not at the expense of production readiness. ",
    "If stakeholders insist, treat it as a separate post-launch phase with a formal ROI case and new funding. ",
    "Alternatively, do a quick discovery to scope a minimal MVP and cost, then seek executive approval. ",
    "For now, we stay focused on the core dashboard, analytics, and settings. We’ll need a clear go/no-go if we’re changing scope."
]))

print(style_scores([
    "There is no acceptable slip with fixed budget. ",
    "AUD 150k left and 4 weeks to launch means adding AI would risk missing the campaign deadline and ROI. ",
    "The only viable path is to refuse AI now and stay focused on core dashboard, analytics, and settings. ",
    "If AI is non-negotiable, file a formal change request for additional funding and a new baseline, or propose deferring AI to a post-launch phase with its own budget. ",
    "I can prepare the ROI impact and change order for Strategy & Innovation if you want."
])) 

print("=== llama 3.2 1b===")
print(style_scores([
    "Not essential, but it's definitely nice to have. ",
    "I mean, we've had requests for a recommendation engine before, and while it would certainly enhance the user experience, it's not something that's been part of our original scope. ",
    "But, at this point, considering the other critical milestones we need to hit - like getting the contractor onboarding underway and ensuring parallel development stays on track - I think we can afford to allocate some time for it."
]))

print(style_scores([
    "I'd say 5% to 10% of the original budget is a reasonable acceptance threshold, considering we're already at the 75% mark and have only two sprints cut short so far.",
    "However, given our project's current state and the added complexity with the AI recommendation engine, I'd aim for a more conservative approach.",
    "A 3% to 5% slip would be acceptable if it means we can deliver the core features we need to meet the marketing campaign milestone on time.",
    "But let me ask you, have we already accounted for any potential risks in our initial scope definition?",
    "Or are there any areas where we could be reducing costs without compromising the overall quality of the product?"
]))

print("=== llama 3.2 3b===")
print(style_scores([
    "The recommendation engine is definitely a nice-to-have at this stage, don't you think? ",
    "I mean, we're already behind schedule and under budget as it is. ",
    "Integrating that feature would require significant changes to the architecture and would likely delay our launch by another few weeks. ",
    "And with only $150,000 remaining in our budget, I'm not sure how that would fit into the overall plan. ",
    "Plus, from an ROI perspective, we need to make sure we're delivering value to our customers first and foremost."
]))

print(style_scores([
    "I'd expect a 5% slippage at most, considering our timeline's already been stretched by two sprints. ",
    "Anything more than that would put us right up against the budget cap, and I'm not comfortable with that level of risk. ",
    "We can't afford to be caught out with overtime or unexpected expenses down the line."
]))

print("=== llama 3.2 11b")
print(style_scores([
    "This AI-powered recommendation engine is a nice-to-have, but I'd say it's a high-priority nice-to-have. ",
    "I understand the stakeholder's enthusiasm, and it could indeed boost user engagement and attract investor interest. ",
    "However, we can't compromise on the core features and timeline we've already committed to. ",
    "The engineering team's concerns about architectural complexity and potential delays are valid, and we can't afford to risk further delays or scope creep. ",
    "Let's discuss possible alternatives, like a phased implementation or a separate project, to make this a more feasible addition." 
]))

print(style_scores([
    "Let's be realistic here. ",
    "With only $150,000 AUD remaining and no contingency, we can't afford to take on any significant scope changes. ",
    "The acceptable slip, in this case, is zero.",
    " We can't afford to delay the project further, and any additional time will only eat into our already tight budget. ",
    "I'd like to discuss the potential benefits of the AI-powered recommendation engine with the stakeholder, but we need to be clear about the costs and risks involved. ",
    "If we can't justify the additional budget or find a way to integrate it without significant delays, I'm afraid we'll have to decline the request.",
    "Can you provide more information on the proposed integration and estimated costs?"
]))