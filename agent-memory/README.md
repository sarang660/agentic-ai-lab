# agent-memory

The smallest possible agent memory system — saves key-value memories to `memory.json` and injects them into the Gemini prompt so the agent remembers across runs.

This isn't about storage. It's about persistence: save something once → load it on the next run → pass it as context to the model → get answers grounded in your memory. That file-backed memory is the core pattern behind stateful agents.

## What it does

- Run it in the terminal, optionally save memories as `key → value` pairs.
- Memories are persisted to `memory.json` (auto-created if missing, starts as `{}`).
- Ask a question about your memory and the model answers using only that memory as context.

## Setup

```bash
npm install
cp .env.example .env
```

Then open `.env` and add your Gemini API key (get one at https://aistudio.google.com/app/apikey):

```
GEMINI_API_KEY=your-key-here
```

## Run it

```bash
npm start
```

Flow: `Would you like to save memories?` → enter key/value pairs → prints current memory → `Enter your question about the memory:` → Gemini responds using `memory.json` as context.

## Files

- `src/index.ts` — CLI: prompts to save memories, loads memory, and calls Gemini with memory injected in the prompt.
- `src/memory.ts` — `loadMemory()` and `saveMemory(key, value)` helpers that read/write `memory.json`.
- `memory.json` — file-backed store, just a JSON object (`{ "key": "value" }`). Delete or reset to `{}` to clear memory.
