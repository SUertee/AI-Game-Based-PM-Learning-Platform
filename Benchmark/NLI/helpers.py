import re
from typing import List

def _regex_sentence_tokenize(text: str) -> List[str]:
    return [s.strip() for s in re.split(r'(?<!\b[A-Z])[.?!]+(?=\s+|$)', text) if s.strip()]

try:
    import nltk
    from nltk.tokenize import sent_tokenize as _nltk_sent_tokenize
    try:
        nltk.data.find("tokenizers/punkt")
        def _sentence_tokenize(text: str) -> List[str]:
            try:
                return [s.strip() for s in _nltk_sent_tokenize(text) if s.strip()]
            except LookupError:
                # NLTK may require extra resources (e.g., punkt_tab); fall back silently
                return _regex_sentence_tokenize(text)
    except (LookupError, OSError):
        # Punkt model not installed; fall back later
        _sentence_tokenize = None  # type: ignore
except Exception:
    _sentence_tokenize = None  # type: ignore

if _sentence_tokenize is None:
    def _sentence_tokenize(text: str) -> List[str]:
        # Regex fallback roughly matches sentence boundaries.
        return _regex_sentence_tokenize(text)

SENT_END = re.compile(r'(?<!\b[A-Z])[.?!]+(?=\s+|$)')  # naive splitter
BULLET = re.compile(r'^\s*[-*•]\s+', flags=re.MULTILINE)

def split_answer_to_hypotheses(text: str) -> List[str]:
    """
    Split one answer string into a list of hypothesis sentences.
    Handles bullets first, then sentence endings.
    """
    if not text or not isinstance(text, str):
        return []

    # Normalize whitespace
    t = re.sub(r'\s+', ' ', text.strip())

    # If bullets exist, split by bullets
    bullets = BULLET.split(text.strip())
    parts = [b.strip() for b in bullets if b.strip()]
    if len(parts) > 1:
        # Re-split each bullet by sentences to avoid over-long items
        out = []
        for p in parts:
            out.extend(_sentence_tokenize(p))
        return out

    # Otherwise split by sentence boundaries
    return _sentence_tokenize(t)
