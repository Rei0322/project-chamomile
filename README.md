# 🌙 A Kingdom by the Sea

*Code name: Project Chamomile.*

A Flash-style gothic memory game inspired by Edgar Allan Poe's **"Annabel Lee"** (1849, public domain), built for the DEV **Hacktoberfest Open-Source AI Challenge, Week 4: Ghost in the Machine**.

Annabel Lee has slept in her sepulchre by the sea for a very long time. You are the one who loved her, standing on the shore, calling her back by remembering the poem. He reads each stanza aloud and stops before its last line; you pick the line that comes next. Remember it and she comes further out of the dark, the marigold path to her tomb unrolls a little further, and she answers him: a whisper you hear, and words written by **Gemma**, an open-weight model, that you read. Forget, and her light runs out: she fades back into the sea, the way the dead fade when no one remembers them.

When the whole poem is remembered, she stands on the shore again, if only for tonight. Other visitors' candles already burn at her tomb, and you can light one or two for someone *you* remember before the credits roll.

**Play it:** [kingdombythesea.tech](https://www.kingdombythesea.tech) (headphones on).

## Why open, why local

The ending asks for the name of someone you loved. Run it at home and that name goes only to Gemma on *your* computer: it is never saved, logged or sent anywhere else. That promise is only possible because Gemma's weights are open. (The hosted demo calls the same family of model through Google's Gemma API for convenience, and says so on screen.) A small open model plus a carefully grounded prompt keeps her honest too: she may only quote real lines from the poem, and her words always begin with what she just whispered aloud.

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
Set `GEMMA_API_KEY` (from Google AI Studio) and optionally `GEMMA_API_MODEL` (default `gemma-4-26b-a4b-it`; Google no longer serves Gemma 3 on its API). The server then calls Gemma through Google instead of Ollama. If no model answers at all, the ghost speaks prepared lines (marked ✦) so the game still works.

### Hosting on DigitalOcean
The live site runs on **DigitalOcean App Platform** (Basic, Node, `npm start`, port 8080), deploying from this repo's `main` branch, with `GEMMA_API_KEY`, `SENTRY_DSN` and `SENTRY_ENVIRONMENT=production` set as encrypted environment variables. The domain uses DigitalOcean's nameservers.

### Tracing with Sentry (optional)
Set `SENTRY_DSN` before starting:
- Codespaces / macOS / Linux: `export SENTRY_DSN="your-dsn"` then `npm start`
- PowerShell: `$env:SENTRY_DSN="your-dsn"; npm start`

## Project layout

```
server.js          Express server; the only thing that talks to Gemma (Ollama or Google's API)
instrument.js      Sentry setup, loaded first; strips IPs and request headers
data/poem.js       The poem, her mood for each stanza, her spoken lines and backup lines
public/index.html  The scene, light meter, poem panel, candle and credits
public/style.css   2000s-web bevels + moonlight
public/app.js      Game loop, canvas scene (12 fps), audio player, ghost and ending
public/audio/      Two-voice recordings, sea loop, music, line timings
public/art/        Flash-style shore and Annabel Lee
docs/              The ElevenLabs voice script
NOTES.md           Build diary
```

## Accessibility

- Every choice is a real button, so the game works with a keyboard and screen readers.
- **Gentle mode** turns off the fading timer, so nobody is rushed.
- **Quiet mode** (on automatically if your device prefers reduced motion) stops the motion: no tide, no sway, no flicker.
- **Sound** can be turned off; every word she speaks is also on screen, and the poem is always written out.

## Built with (and credits)

Everything this project uses, so it's all traceable.

| What | Used for |
|---|---|
| **Gemma** (Google DeepMind, open-weight) | Annabel Lee's words. Runs locally through **Ollama** (`gemma3:4b` at home, `gemma3:1b` in Codespaces), and through **Google's Gemma API** (`gemma-4-26b-a4b-it`) on the hosted site. |
| **Ollama** | Serving Gemma on your own machine, so the candle name never leaves it. |
| **ElevenLabs** | Both voices, designed in Studio: Poe Narrator (the lover, reading the poem) and Annabel Narrator (her whispers). The sea loop (Sound Effects) and the music (Music): "Tide Memory," "Mourning Light" and "Warm Return." Voice by ElevenLabs. |
| **DigitalOcean** | App Platform hosting for the live game. |
| **kingdombythesea.tech** | The project's home, a .tech domain claimed through Hacktoberfest. |
| **Kittl** (Nano Banana Pro) | Generating the Flash-style shore and ghost art. |
| **The Met, fashion plate** | Annabel's gown is based on *Le Follet*, April 1849 (the year the poem was published), from The Metropolitan Museum of Art's fashion plate collection. |
| **Sentry** | Tracing every call to Gemma: which model answered, how long it took, tokens in and out, and every time the ghost had to fall back to a prepared line. No prompts, replies or candle names are sent. |
| **GitHub Codespaces** | Building and testing in the cloud during the week. |
| **Claude Code (Anthropic)** | Coding assistant for the build. |
| **Node.js + Express**, HTML canvas | The game itself: no Flash, no game engine. |

The poem: "Annabel Lee" by Edgar Allan Poe (1849), public domain.
Inspired by Día de los Muertos and the idea, as in *Coco*, that the dead stay with us while we remember them; and by Annabel Blackthorn in Cassandra Clare's *Lady Midnight*, which first led me to the poem.

Built by [Samira Ray](https://samira-ray.dev).

## License

MIT
