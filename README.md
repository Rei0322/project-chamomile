# 🌙 A Kingdom by the Sea

*Code name: Project Chamomile.*

A Shockwave-style gothic point-and-click inspired by Edgar Allan Poe's **"Annabel Lee"** (1849, public domain), built for the DEV **Hacktoberfest Open-Source AI Challenge, Week 4: Ghost in the Machine**.

Annabel Lee has slept in her sepulchre by the sea for a very long time. You are the one who loved her, standing on the shore, calling her back by remembering the poem one stanza at a time. Each stanza you remember brings her further out of the dark, lights another stretch of the marigold path, and wakes her voice, played by **Gemma**, an open-weight model. Forget, and her light runs out: she fades back into the sea, the way the dead fade when no one remembers them.

When the whole poem is remembered, she stands on the shore again, if only for tonight, and you can light a candle for someone *you* remember.

## Why open, why local

The ending asks for the name of someone you loved. That name goes to a model on *your* computer and is never saved, logged or sent anywhere else. A small open model plus a carefully grounded prompt (the ghost may only quote real lines from the poem) keeps it both private and honest.

## Run it

### In GitHub Codespaces (easiest)
1. Open this repo in a codespace. The dev container installs Ollama, pulls `gemma3:1b` and runs `npm install` for you. The first build takes a few minutes.
2. Run `npm start`.
3. Open the forwarded port **3000**.

### On your own computer
1. Install [Ollama](https://ollama.com) (Windows: `winget install Ollama.Ollama`).
2. `ollama pull gemma3:4b`
3. `npm install`
4. Run with the bigger model:
   - PowerShell: `$env:CHAMOMILE_MODEL="gemma3:4b"; npm start`
   - macOS/Linux: `CHAMOMILE_MODEL=gemma3:4b npm start`
5. Visit http://localhost:3000

### Hosted (Gemma through Google's API)
Set `GEMMA_API_KEY` (from Google AI Studio) and optionally `GEMMA_API_MODEL` (default `gemma-3-4b-it`). The server then calls Gemma through Google instead of Ollama. If no model answers at all, the ghost speaks prepared lines (marked ✦) so the game still works.

## Project layout

```
server.js          Express server; the only thing that talks to Ollama
data/poem.js       The poem text + which hotspot reveals which stanza
public/index.html  The scene, light meter, recitation and candle
public/style.css   Shockwave-era bevels + moonlight
public/app.js      The game loop, canvas scene, ghost and candle ending
NOTES.md           Build diary (becomes the DEV write-up)
```

## Accessibility

- Every choice is a real button, so the game works with a keyboard and screen readers.
- **Gentle mode** turns off the fading timer, so nobody is rushed.
- **Quiet mode** (on automatically if your device prefers reduced motion) stops the twinkling stars and the tide.

## Credits

- "Annabel Lee" by Edgar Allan Poe (1849), public domain.
- Gemma by Google DeepMind, run with Ollama (local) or Google's Gemma API (hosted).
- Inspired by Día de los Muertos and the idea, as in *Coco*, that the dead stay with us while we remember them.
- Built by [Samira Ray](https://samira-ray.dev).

## License

MIT
