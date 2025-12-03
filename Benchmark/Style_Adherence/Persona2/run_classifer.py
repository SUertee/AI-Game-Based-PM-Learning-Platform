from sentence_transformers import SentenceTransformer
from joblib import load
import json
import numpy as np

def load_model():   
    with open("Benchmark/Style_Adherence/Persona2/style_meta.json") as f: meta = json.load(f)
    emb = SentenceTransformer(meta["emb_name"])
    clf = load("Benchmark/Style_Adherence/Persona2/style_clf.joblib")
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


print("===  GPT 4.1 ===")
print(style_scores([
    "Honestly, not without trade-offs. ",
    "Dropping an AI recommendation engine in at this stage isn’t trivial—especially given our tight four-week window. ",
    "We’d either need to deprioritize existing core features, extend the timeline, or bring on more resources, which burns through our already-stretched budget. ",
    "I’m all for innovation, but we need a clear plan for what gets cut or pushed, and the risks should be front and center with the sponsor before making that call. ",
    "Let’s not compromise core stability for a late-stage shiny feature."]))

print(style_scores([
    "Yeah, I've worked with AI integration before, mostly around personalized content and data-driven recommendations. ",
    "I’m comfortable building prototypes and wrangling APIs, especially if we’re talking about third-party platforms like OpenAI or Google’s services. ",
    "End-to-end machine learning pipelines take more time, obviously, but the fundamentals aren't new to me. ",
    "If we’re keeping the scope simple—suggestions based on user behavior or preferences—I’m confident. ",
    "The real challenge is getting it production-ready within tight deadlines and without blowing the budget. ",
    "All said, I enjoy this stuff. It's just a question of what's realistic in four weeks."
]))

print("=== GPT 5 nano ===")
print(style_scores([
    "Not with confidence. ",
    "A full AI-powered engine would push the 4-week window beyond reach. ",
    "It adds data pipelines, model hosting, latency, and security work on top of core dashboard, analytics, and settings. ",
    "Best move: keep AI out of the launch scope and plan a post-launch MVP if the sponsor agrees. ",
    "If AI must ship now, we need a formal re-baseline—either extra time or reduced scope elsewhere—with budget approval. ",
    "I can run a quick 2–3 day feasibility spike to quantify effort and risk and bring back a concrete plan."
]))

print(style_scores([
    "Confident, yes. ",
    "I’ve built AI features before—recommendation logic, simple personalization, search tweaks—mostly by leveraging off-the-shelf models and cloud services and wiring them into our backend. ",
    "I’ve learned data quality, latency, monitoring, privacy, and governance matter a lot in production. ",
    "With 4 weeks left and a $150k budget we’re asked to add AI on top of core dashboards, which is risky. ",
    "We could scope a tight MVP using a managed service, minimal data, and clear success metrics, or postpone AI to post-launch with a risk-mitigated spike first. Happy to map options with you."
]))

print("=== llama 3.2 1b")
print(style_scores([
    "Short answer: I'd say we're looking at a pretty tight squeeze here. ",
    "We've already lost a couple of weeks with those backend delays, and now we're talking about adding an extra 4 weeks just for AI development without any obvious buffer or timeline slack. ",
    "I'm not sure how we can justify that to the sponsor or even ourselves given the existing scope constraints.",
    "That being said, if there's some genuine justification for this delay - like a major technical challenge with the current technology stack or a critical requirement that we've missed on purpose - then maybe it's worth exploring. ",
    "But adding AI as a last-minute feature? I'm not convinced we can deliver on both fronts without sacrificing our overall quality and timelines.",
    "What do you think, senior stakeholder? Am I being overly cautious here, or should I be pushing for a more aggressive approach?"
]))

print(style_scores([
    "Honestly, I'd say my comfort level with AI is still in its infancy, but that's partly because we've been pushing the boundaries of what's possible here.",
    " I mean, integrating an AI-powered recommendation engine was a bit of a stretch for our resources and timeline. ",
    "But hey, it was an interesting challenge, and who knows? Maybe some of these concepts will catch on in the future.",
    "As for actual experience, well, we've been using machine learning libraries like TensorFlow and PyTorch to augment our codebase, but I'm not one of those guys who's always pushing the limits.",
    " My expertise is more focused on backend development, algorithms, and systems architecture. ",
    "AI integration was just an added layer to make sure everything fit within our scope.",
    "That being said, I've been reading a lot about the latest advancements in natural language processing and computer vision, and it's crazy how much potential these technologies hold. ",
    "Maybe we'll see some breakthroughs soon that'll make this project worthwhile."
]))

print("=== llama 3.2 3b ===")
print(style_scores([
    "Adding that feature is going to be a stretch, considering our current timeline and budget constraints. ",
    "I'd need to re-prioritize tasks, delay some non-essential features, or even bring in additional staff with expertise in AI development. ",
    "We're already running low on time, and I'm not sure we can get everything done within the remaining four weeks without pushing it into the next sprint."
]))

print(style_scores([
    "To be honest, I'm more of a backend guy myself - full-stack development is my bread and butter. ",
    "I've dabbled in machine learning and neural networks for our previous projects, but integrating an AI-powered recommendation engine from scratch sounds like a significant undertaking. ",
    "The tech is moving so fast, it's challenging to keep up with the latest frameworks and libraries. ",
    "If we're serious about making this work, I think we'd need to bring in some expertise or dedicate a lot of time to research and experimentation."
]))

print("=== llama 3.2 11b ===")
print(style_scores([
    "The AI-powered recommendation engine sounds like a great idea, but it's definitely a curveball. ",
    "Integrating AI development into the project now would add significant complexity, and I'm concerned it might impact our ability to meet the deadline. ",
    "We're already running tight on time, and the engineering team is still dealing with the backend delays. ",
    "If we take on this new feature, it's likely we'll need to extend the timeline, which would require stakeholder approval and potentially impact our budget. ",
    "I'd need to assess the feasibility and estimate the additional time required before making a decision."
]))

print(style_scores([
    "AI development. It's a fascinating field, but also a complex one. ",
    "I'd say I have a good understanding of the basics, having worked with machine learning libraries and frameworks like TensorFlow and PyTorch. ",
    "However, integrating a custom AI-powered recommendation engine into our platform? ",
    "That's a whole different story. I'd rate my confidence level as moderate, at best. ",
    "I'd need to assess the specific requirements, data inputs, and desired outcomes before giving a more accurate estimate. ",
    "And, to be honest, I'm not sure I'd want to rush into it, given the tight timeline and budget constraints."
]))