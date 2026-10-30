# v1.0.0: A Kingdom by the Sea

The first full release, submitted to the DEV Hacktoberfest Open-Source AI Challenge, Week 4: Ghost in the Machine.

**Play it:** https://www.kingdombythesea.tech (headphones on)

## What it is
A Flash-style memory game inspired by Edgar Allan Poe's "Annabel Lee" (1849). You are the lost love, calling Annabel Lee back from her sepulchre by remembering the poem. He reads each stanza aloud and stops before its last line; pick the line that comes next. Remember, and she comes further out of the dark and answers him. Forget, and her light runs out.

## In this release
- **Six stanzas, call and response.** Two designed ElevenLabs voices: him reading the poem, her whispers growing clearer each stanza. Lines appear on screen as he reaches them.
- **Annabel's words by Gemma**, an open-weight model: locally through Ollama (`gemma3:4b`), online through Google's Gemma API (`gemma-4-26b-a4b-it`, minimal thinking). Her written reply always begins with what she just whispered aloud. Prepared lines (marked ✦) if no model answers.
- **Sound:** a sea loop and three music pieces ("Tide Memory," "Mourning Light," "Warm Return"), mixed under the voices; the music crossfades as the grief takes hold at stanza four.
- **The ending:** light a candle (optional) for someone you remember, then the credits roll. The game never saves the name.
- **Sentry tracing** for every Gemma call (model, timing, tokens), with no prompts, replies, names or visitor IPs sent.
- **Flash-style art and motion** on an HTML canvas at 12 fps: no Flash, no game engine. Vintage mode, Gentle mode (she never fades) and Quiet mode (no motion).
- Hosted on DigitalOcean App Platform at kingdombythesea.tech.

## Credits
Built by Samira Ray. Gemma (Google DeepMind) · Ollama · ElevenLabs · Sentry · DigitalOcean · Kittl with Nano Banana Pro · *Le Follet*, April 1849, The Metropolitan Museum of Art · Claude Code (coding assistant).
"Annabel Lee" by Edgar Allan Poe (1849), public domain. Inspired by Día de los Muertos, *Coco*, and Cassandra Clare's *Lady Midnight*.

## License
MIT
