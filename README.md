# 🌙 A Kingdom by the Sea

*Code name: Project Chamomile.*

A Shockwave-style gothic point-and-click inspired by Edgar Allan Poe's **"Annabel Lee"** (1849, public domain), built for the DEV **Hacktoberfest Open-Source AI Challenge, Week 4: Ghost in the Machine**.

Walk a moonlit shore. Touch the moon, the stars, the sea and the sepulchre. Each one wakes a stanza and the ghost of Annabel Lee, played by **Gemma**, an open-weight model running **locally** through **Ollama**. At the sepulchre, you can light a candle for someone you've lost.

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

## Project layout

```
server.js          Express server; the only thing that talks to Ollama
data/poem.js       The poem text + which hotspot reveals which stanza
public/index.html  The scene, loader and dialogue box
public/style.css   Shockwave-era bevels + moonlight
public/app.js      Canvas drawing, hotspots, candle ending
NOTES.md           Build diary (becomes the DEV write-up)
```

## Accessibility

- Hotspots are real buttons, so the scene works with a keyboard and screen readers.
- **Quiet mode** (on automatically if your device prefers reduced motion) stops the twinkling stars and the tide.

## Credits

- "Annabel Lee" by Edgar Allan Poe (1849), public domain.
- Gemma by Google DeepMind, run with Ollama.
- Built by [Samira Ray](https://samira-ray.dev).

## License

MIT
