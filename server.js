// Project Chamomile ("A Kingdom by the Sea")
// A tiny Express server. The browser never talks to Ollama directly:
// it talks to this server, and this server talks to the local model.

const express = require("express");
const { TITLE, AUTHOR, STANZAS, HOTSPOTS } = require("./data/poem");

const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
// gemma3:1b in Codespaces (fast on CPU), gemma3:4b at home for the real demo.
const MODEL = process.env.CHAMOMILE_MODEL || "gemma3:1b";

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(express.static("public"));

// ---------- Simple rate limit: a few ghost replies per minute per visitor ----------
const hits = new Map();
const LIMIT = 8;          // requests
const WINDOW_MS = 60_000; // per minute
function rateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    return res.status(429).json({ answer: "The tide is resting. Return in a moment…" });
  }
  recent.push(now);
  hits.set(key, recent);
  next();
}

// ---------- The ghost's character ----------
const POEM_TEXT = STANZAS.map(s => s.join("\n")).join("\n\n");
const SYSTEM_PROMPT = `You are the ghost of Annabel Lee from the poem "${TITLE}" by ${AUTHOR}.
You haunt a moonlit kingdom by the sea. You speak softly, briefly (2-4 sentences),
in a gentle, gothic, 19th-century voice. You are tender, never frightening for its own sake.

Rules:
- If you quote the poem, quote ONLY lines that appear exactly in the text below. Never invent Poe lines.
- Do not claim facts about Poe's life unless you are certain; prefer feelings and imagery.
- Never ask for or repeat personal information. If someone names a person they have lost,
  honor that name warmly and do not ask follow-up questions about them.

The poem:
${POEM_TEXT}`;

async function askGemma(userMessage) {
  const r = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      options: { temperature: 0.8 },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ]
    })
  });
  if (!r.ok) throw new Error(`Ollama responded ${r.status}`);
  const data = await r.json();
  return data.message?.content?.trim() || "…";
}

// The scene asks for a hotspot's stanza (no AI needed, always exact).
app.get("/api/stanza/:hotspot", (req, res) => {
  const spot = HOTSPOTS[req.params.hotspot];
  if (!spot) return res.status(404).json({ error: "Unknown hotspot" });
  res.json({ label: spot.label, lines: STANZAS[spot.stanza] });
});

// The ghost reacts to a hotspot, or answers a visitor's question.
app.post("/api/ghost", rateLimit, async (req, res) => {
  const { hotspot, message } = req.body || {};
  const spot = HOTSPOTS[hotspot];
  const question = String(message || "").slice(0, 300);
  const prompt = spot
    ? `The visitor has touched ${spot.label}. Respond to them about it, in character.`
    : `The visitor says: "${question}". Respond in character.`;
  try {
    res.json({ answer: await askGemma(prompt) });
  } catch (err) {
    console.error(err.message);
    res.status(503).json({ answer: "The fog is too thick tonight. (Is Ollama running?)" });
  }
});

// The ending: light a candle for someone. The name is used once and never stored or logged.
app.post("/api/candle", rateLimit, async (req, res) => {
  const name = String(req.body?.name || "").replace(/[^\p{L}\p{M}\s'.-]/gu, "").slice(0, 60).trim();
  if (!name) return res.status(400).json({ answer: "Whisper a name to the candle…" });
  try {
    const answer = await askGemma(
      `A visitor has lit a candle at your sepulchre for someone they loved and lost, named ${name}. ` +
      `Offer a short, tender remembrance for ${name} (3 sentences at most).`
    );
    res.json({ answer });
  } catch (err) {
    res.status(503).json({ answer: "The candle flickers, but the sea is silent tonight." });
  }
});

app.listen(PORT, () => {
  console.log(`🌙 A Kingdom by the Sea is listening on http://localhost:${PORT}`);
  console.log(`   Model: ${MODEL} at ${OLLAMA_URL}`);
});
