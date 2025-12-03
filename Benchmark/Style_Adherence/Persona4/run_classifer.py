from sentence_transformers import SentenceTransformer
from joblib import load
import json
import numpy as np

def load_model():   
    with open("Benchmark/Style_Adherence/Persona4/style_meta.json") as f: meta = json.load(f)
    emb = SentenceTransformer(meta["emb_name"])
    clf = load("Benchmark/Style_Adherence/Persona4/style_clf.joblib")
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
    "Given our current situation—tight budget, zero contingency, and only four weeks left—I’d first look at anything non-essential to app reliability or accessibility. ",
    "Non-critical analytics or advanced customization could go before core features like secure authentication or real-time notifications. ",
    "We absolutely can’t risk production readiness or accessibility for end users. ",
    "If we touch scope, it must be justified, and we should communicate potential quality risks up front. ",
    "Honestly, cutting corners is never my choice, but if push comes to shove, I’d protect stability above all."]))

print(style_scores([
    "Typically the project sponsor or executive sponsor signs off on success, with the Product Owner validating business acceptance. ",
    "On delivery, QA confirms the product meets agreed quality, and a Release or Engineering Manager signs off deployment readiness. ",
    "In this case, success also hinges on sponsor approval of any scope change (AI) and delivery of the original scope—core dashboard, analytics, and settings—within time and budget. ",
    "Any trade-offs must be reviewed with the sponsor before final acceptance."
]))

print("=== GPT 5 nano ===")
print(style_scores([
    "As a first de-scope move, shelve the AI integration entirely. ",
    "It’s outside scope, would push schedule, and needs new budget. ",
    "If you must trim now, the safest next candidates are non-critical analytics enhancements (beyond basic dashboards) or optional notification features that aren’t essential to the MVP. ",
    "Do not drop core dashboard features, secure auth, or real-time notifications without sponsor approval and a risk plan. ",
    "I recommend a phased approach: deliver the MVP in scope; treat AI as a post-launch pilot with a formal change request, budget impact, and timeline revision."
]))

print(style_scores([
    "Ultimately the project sponsor signs off on success, with the product owner confirming business acceptance and release readiness. ",
    "In practice you need a joint go/no-go: sponsor approves the launch, product owner signs off on scope and value, engineering confirms technical readiness, QA validates quality and production readiness, and the release manager signs off the deployment plan. ",
    "If the AI integration is later approved, we’ll need a revised plan and budget with the sponsor."
]))

print("=== llama 3.2 1b ===")
print(style_scores([
    "We can definitely revisit some of the original scope items to see where we can make some cuts without impacting the overall goal. ",
    "With budget constraints and time pressure, I'd say we should prioritize features that are either critical or have a high business impact.",
    "For instance, let's look at the AI-powered recommendation engine. ",
    "'While it might seem like a great idea to include it in the core dashboard, it adds a significant amount of complexity and potential delays. ",
    "'If we can't justify allocating the budget for this feature, maybe we can consider alternatives, such as integrating some basic analytics or user settings.",
    "Regarding contractor rates and overtime, I'd like to request a review of those numbers. ",
    "'Can you provide me with more details on who's working on the current sprint and what their compensation structures are? ",
    "That way, I can better understand where our expenses are coming from and make informed decisions about where we should cut back first."
]))

print(style_scores([
    "Our sponsor is Emily Patel from Strategy & Innovation, but she's currently out of town for a conference and won't be back until next week.",
    "I'm keeping her updated through our project management tool and will send her a summary of our progress at the end of the sprint. ",
    "She should receive it via email by the end of today.",
    "In terms of tracking our time and budget, I've allocated specific days for key milestones, like today's task list. ",
    "The rest of the team is aware that their individual tasks are crucial to meeting the deadline. ",
    "If anyone has concerns or questions about our progress, they can reach me through direct messaging in the project chat."
]))

print("=== llama 3.2 3b ===")
print(style_scores([
    "If we need to make any adjustments, I'd say we should prioritize the feature that has the most significant impact on our overall goal of meeting the deadline and staying within budget.",
    "Given the current timeline and the fact that AI development would require a substantial chunk of our remaining budget, I think it's best to put the brakes on that idea for now. ",
    "We could explore alternative ways to boost user engagement, like optimizing the existing dashboard or revisiting analytics features.",
    "We should discuss this with our engineering team and strategy stakeholder to see if there are any compromises we can make while still delivering a solid product.",
    "What do you think? Should we have a meeting to iron out the details?"
]))

print(style_scores([
    "The project sponsor is usually the person who's willing to take ownership of the final product, especially when it comes to meeting tight timelines and budget constraints. ",
    "In our case, that would be Jane from Marketing, I think. ",
    "She's been keeping an eye on everything from a strategic perspective, ensuring we're aligned with their overall goals. ",
    "As long as she's comfortable with the plan and can provide her buy-in, that's usually enough for me to move forward with confidence."
]))

print("=== llama 3.2 11b ===")
print(style_scores([
    "I'd like to review the original scope and see what's absolutely essential to delivering a minimum viable product. ",
    "The core dashboard features, analytics, and user settings are already quite a lot to tackle in the remaining four weeks.",
    "Adding an AI-powered recommendation engine on top of that would be a significant stretch.",
    "If we had to de-scope, I'd say we'd have to revisit the analytics feature. ",
    "While it's crucial for understanding user behavior, it's also a complex component that could potentially delay the project further. ",
    "Maybe we could simplify the analytics feature or prioritize the most critical aspects of it, like tracking user engagement and basic metrics. ",
    "That would allow us to focus on the core dashboard features and user settings while still delivering a solid product."
]))

print(style_scores([
    "The sign-off on success for our project is the Product Owner, Rachel Lee. ",
    "She's the one who ensures that the product meets the business requirements and that the features delivered are aligned with the overall product strategy. ",
    "If we're adding a new feature, like the AI-powered recommendation engine, Rachel will need to be involved in the decision-making process and will ultimately sign off on its inclusion in the project scope."
]))