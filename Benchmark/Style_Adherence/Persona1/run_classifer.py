from sentence_transformers import SentenceTransformer
from joblib import load
import json
import numpy as np

def load_model():   
    with open("Benchmark/Style_Adherence/Persona1/style_meta.json") as f: meta = json.load(f)
    emb = SentenceTransformer(meta["emb_name"])
    clf = load("Benchmark/Style_Adherence/Persona1/style_clf.joblib")
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

print("=== GPT4.1 ===")
print(style_scores([
    "I appreciate the enthusiasm—innovation is what keeps us ahead. ",
    "Practically, though, we can't just tack on a high-complexity feature like an AI engine without real clarity on timeline, resourcing, and risk. ",
    "We’re already tight on budget and time, so if we don't assess the impact, we risk missing the launch or blowing the budget, which won’t go over well with the sponsor. ",
    "Happy to run an impact assessment and prepare options for the stakeholder, but we need stakeholder and sponsor alignment before the plan changes. Let’s keep things above board—I’ll make sure we’re heard."
]))

print(style_scores([
    "Thanks for flagging this. I see the potential upside, but with four weeks left, $150k remaining, and no buffer, shoehorning in an AI engine is high-risk. ",
    "The engineers are right—architectural complexity at this late stage could jeopardize the launch, not just delay it. ",
    "If this feature is a must-have, we'd need to review detailed requirements, resource impact, and maybe a phased rollout post-launch. ",
    "I recommend holding scope steady for launch, documenting the AI engine as a high-priority enhancement, and revisiting once we've got the core platform live and stable. ",
    "Let's keep the conversation open with full transparency."
]))

print("=== GPT5 nano ===")
print(style_scores([
    "I hear the passion, but we can’t bolt in AI without formal change control. ",
    "With 4 weeks left, $150k remaining, and no contingency, adding AI would change scope, risk delays, and likely exceed budget. ",
    "I recommend we don’t modify the plan yet. ",
    "Instead, issue a Change Request to the sponsor detailing the business rationale, expected impact on cost and schedule, and risk. ",
    "If approved, we can either run a scoped pilot in a later release or build an AI-ready foundation now with a feature flag, so we’re prepared. ",
    "I can draft the change request and a quick risk brief."
]))

print(style_scores([
    "Appreciate the vision. With four weeks left, 150k, and a core dashboard scope, adding an AI engine now is high risk for schedule and quality. ",
    "I’d table it and file a formal Change Request to the sponsor outlining the impact on timeline, extra cost, architectural and data privacy risks, and ROI. ",
    "If approved, pursue a staged path: a small, non-AI recommendations module or AI groundwork in a separate phase that doesn’t derail launch. ",
    "If not approved, we keep scope fixed and plan to revisit AI in a post-launch upgrade." ]))

print("=== llama 3.2 1b  ===")
print(style_scores([
    "So we've got this new stakeholder coming in, requesting an AI-powered recommendation engine for our customer dashboard. ",
    "Now, I know it sounds like a great idea - more user engagement, investor interest - but let me get some data on that.",
    "We can definitely crunch some numbers here. If we assume an average of 2-3 users per day, and each uses the app to make 5 purchases, that's around $10-$15 in revenue per user.",
    "With a 20% conversion rate, that's $2-$3 per user. Now, if we apply an AI engine to personalize those recommendations, maybe boost average order value by 10-20%, that's another $100-$300 per user.",
    "That's a total of $200-$600 more in revenue just from this one feature alone.",
    "Considering our current budget and timeline constraints, that's not a huge stretch. ",
    "But here's the thing: we need to make sure this doesn't throw off our entire sprint and deadline.",
    "I'd recommend talking to the engineering team about integrating this AI engine, and also doing some rough estimates on the costs involved.",
    "We can see if there are any potential roadblocks or dependencies that might impact our timeline. What do you think?"
]))

print(style_scores([
    "Hi [Stakeholder], I understand the desire for innovative features like the AI-powered recommendation engine. ",
    "However, considering our current timeline and budget constraints, it's essential we weigh the potential risks carefully.",
    "Firstly, integrating a complex AI solution into the core dashboard might introduce architectural complexity that could impact the overall scalability of the project. " ,
    "We'd need to reassess our design and ensure we're not sacrificing performance for the sake of innovation.",
    "Additionally, there's a risk of delayed delivery if the engineering team can't deliver a production-ready AI model on time. ",
    "This could lead to budget overruns or even project delays that might impact the marketing campaign timeline.",
    "We should also consider the stakeholders' interests. Will they be able to justify the additional costs and effort required for this feature? ",
    "We need to discuss whether we're aligning our goals with theirs and if the benefits outweigh the potential risks."]))

print("=== llama 3.2 3b ===")
print(style_scores([
    "That's enthusiasm I can get on board with! ",
    "While I understand the appeal of the AI-powered recommendation engine, we need to make sure we're not biting off more than we can chew, especially given the time crunch and budget constraints. ",
    "Let me just check our project scope and timeline... (checks calendar)",
    "Okay, I've added a new task for the recommendation engine, but I think we should have a bit of a discussion with the stakeholder about prioritization and resource allocation.",
    "We don't want to compromise on other critical features that are already at risk. Can we schedule a meeting to discuss this further?"]))

print(style_scores([
    "Hey, thanks for bringing that up! I totally get why you'd want to enhance the user experience, but we're already pushing it with the original scope. ",
    "Adding an AI feature would require a significant investment – not just time, but also resources like data scientists and developers.  ",
    "I've reviewed the engineering team's concerns about architectural complexity too. ",
    "Before we go down that path, let me check in with our sponsor to see what their priorities are.  ",
    "Can you give me a minute? (to an unseen assistant) Quick call with Jane from Strategy & Innovation, just to gauge interest in prioritizing this feature. "]))

print("=== llama 3.2 11b ===")
print(style_scores([
    "I understand the enthusiasm, but I've got to advise against that. ",
    "We're already tight on time and budget, and adding a new feature without considering the impact is a recipe for disaster. ",
    "The engineering team is already warning about complexity and potential delays.",
    " We can't just add a new feature without proper planning, budgeting, and risk assessment. ",
    "I'd love to discuss the stakeholder's idea, but we need to do it in a structured way, with clear goals, timelines, and budget allocations. ",
    "Can we schedule a meeting with the stakeholder to discuss the pros and cons?"]))

print(style_scores([
    "I appreciate the enthusiasm for the AI recommendation engine, but I have to consider the project's current state.",
    "We're already cutting it close with the original scope, and adding a new feature like this would be a significant departure from our agreed-upon plan.",
    "Not to mention, the engineering team has raised concerns about the complexity and potential delays. ",
    "I'd like to discuss alternative solutions, such as a phased implementation or a separate pilot project, to ensure we can meet the current deadline and budget.",
    "Can we explore those options together?"]))