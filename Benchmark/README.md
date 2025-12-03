## The input structure
```json
{
  "prompt_context": "optional context here",
  "persona_premises": [],
  "gold_checklist": [],
  "knowledge_base": {}
}
```

## The answer structure
```json
{
  "answers": [
    {
      "id": "ex1",
      "text": "I would avoid risky strategies. As a former PMO consultant, I document everything."
    },
    {
      "id": "ex2",
      "text": "- Let's take a reckless bet\n- No need to write it down"
    }
  ]
}

```

## Commands
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install transformers torch --upgrade

```