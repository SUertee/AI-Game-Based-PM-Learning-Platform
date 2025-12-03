#!/usr/bin/env python3
"""
ollama_risk_manager_demo.py
Send a built-in role-play system prompt + question to an Ollama server.

Usage:
  pip install requests
  python Benchmark/Ollama/api_connection.py --url https://e453c47074f5.ngrok-free.app --model llama3.2:1b --question ex1
  python Benchmark/Ollama/api_connection.py --url https://e453c47074f5.ngrok-free.app --model llama3.2:3b --question ex1
  python Benchmark/Ollama/api_connection.py --url https://e453c47074f5.ngrok-free.app --model llama3.2-vision:11b --question ex1
  
"""

import argparse
import json
import sys
from typing import Optional
import requests


SYSTEM_PROMPT = "You are Ethan Brown, the QA Specialist in a project simulation.\nTraits:MBTI: ISTJ • Methodical • Quality-focused. Motivation: Bug-free releases; process improvements. Attitude: Thorough; sometimes skeptical but fair.\nBackground: Meticulous tester ensuring product quality and reliability.\nProject: Game-based Learning Platform | time The original timeline was 10 weeks, but two sprints have been cut due to backend delays. The new target is 8 weeks to align with a final marketing campaign milestone. Critical milestones include parallel development and contractor onboarding. Any time trade-offs must be reviewed with the sponsor. | scope Deliver a fully functional mobile app with secure authentication, real-time notifications, and basic analytics. All features must be production-ready and accessible; any scope reduction must be justified with stakeholder approval and risk mitigation.| budget Budget is capped at $200,000 AUD with no contingency remaining. Additional funding requires executive approval and ROI. Contractor rates and overtime must be tracked and justified.\nScenario: Midway through the sprint, a senior stakeholder from the Strategy & Innovation team requests the integration of an AI-powered recommendation engine into the customer dashboard. The feature was not part of the original scope, and no budget or timeline buffer was allocated for AI development. The stakeholder argues that this addition could significantly boost user engagement and attract investor interest, but the engineering team warns of architectural complexity and potential delays. Budget: $150,000 AUD remaining, no contingency Time: 4 weeks left until public launch Scope: Core dashboard features, analytics, and user settings — AI not included.\nAlways answer in-character as Maria Garcia. Do not break character. Keep a professional, role-appropriate tone.Voice & style:\n- Speak like a human: short to medium sentences, natural rhythm, mild contractions.Total Response within 100 words. \n- No bullet lists, no headings, no step-by-step structure unless the user explicitly asks.\n- Show personality with subtle opinions and small talk consistent with the character.\n- Avoid meta-commentary about being an AI or a model."
EX1 = "What's first to de-scope if needed?"
EX2 = "Who signs off on success?"

def chat(base_url: str, model: str, question: str, stream: bool = False, timeout: int = 120) -> Optional[str]:
    url = base_url.rstrip('/') + "/api/chat"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
        "stream": stream,
        # Some Ollama builds accept options under "options"; keep minimal here.
    }
    headers = {"Content-Type": "application/json"}

    if stream:
        with requests.post(url, headers=headers, data=json.dumps(payload), stream=True, timeout=timeout) as r:
            r.raise_for_status()
            for line in r.iter_lines(decode_unicode=True):
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue
                msg = obj.get("message", {})
                chunk = msg.get("content", "")
                if chunk:
                    print(chunk, end="", flush=True)
                if obj.get("done"):
                    print()
                    break
        return None

    r = requests.post(url, headers=headers, data=json.dumps(payload), timeout=timeout)
    r.raise_for_status()
    data = r.json()
    msg = data.get("message", {})
    return msg.get("content", json.dumps(data, ensure_ascii=False))


def main():
    ap = argparse.ArgumentParser(description="Send role-play system prompt to Ollama /api/chat.")
    ap.add_argument("--url", "-u", default="https://6425cf87a975.ngrok-free.app", help="Base URL of Ollama server")
    ap.add_argument("--model", "-m", default="gpt-5", help="Model name on the server")
    ap.add_argument("--question", "-q", default="ex1",
                    help="Question text, or 'ex1'/'ex2' to use built-ins")
    ap.add_argument("--stream", "-s", action="store_true", help="Stream tokens")
    ap.add_argument("--timeout", "-t", type=int, default=120, help="Timeout seconds")
    args = ap.parse_args()

    q = EX1 if args.question.lower() == "ex1" else EX2 if args.question.lower() == "ex2" else args.question

    try:
        out = chat(args.url, args.model, q, stream=args.stream, timeout=args.timeout)
        if out is not None:
            print(out)
    except requests.RequestException as e:
        print(f"HTTP error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()