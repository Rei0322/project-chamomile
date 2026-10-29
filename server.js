// Project Chamomile ("A Kingdom by the Sea")
// A tiny Express server. The browser never talks to a model directly:
// it talks to this server, and this server talks to Gemma.
//
// Where Gemma runs:
//   - At home / in Codespaces: Ollama on this machine (default).
//   - On the hosted site: Google's Gemma API, if GEMMA_API_KEY is set.
// If neither answers, the ghost speaks prepared lines so the game still works.

const Sentry = require("./instrument");   // must load first
const express = require("express");
const { TITLE, AUTHOR, STANZAS, ARC, SPOKEN, FALLBACK } = require("./data/poem");

const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
// gemma3:1b in Codespaces (fast on CPU), gemma3:4b at home for the real demo.
let MODEL = process.env.CHAMOMILE_MODEL || "gemma3:1b";
const GEMMA_API_KEY = process.env.GEMMA_API_KEY || "";
// Google retired Gemma 3 from its hosted API in 2026; Gemma 4 is what it serves now.
// gemma-4-26b-a4b-it is a mixture-of-experts model with about 4B parameters active, so it's quick.
const GEMMA_API_MODEL = process.env.GEMMA_API_MODEL || "gemma-4-26b-a4b-it";
const PROVIDER = GEMMA_API_KEY ? "google" : "ollama";

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(express.static("public"));

// ---------- Simple rate limit: a few ghost replies per minute per visitor ----------
const hits = new Map();
const LIMIT = 20;         // requests
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
You have slept in your sepulchre by the sea for a very long time. Now the one who loved you
stands on the shore, calling you back by reciting the poem. Each stanza they remember
brings you a little further out of the dark. If they stop remembering, you fade away again.

This is a call and response: he recites, you answer. You are lost, finding your way back by following
his voice. Speak softly and briefly (1-2 sentences), in a gentle, 19th-century voice, to the one calling
you ("my love"). You are tender and longing. Never wail, scream, or frighten; you whisper, you reach.

Rules:
- If you quote the poem, quote ONLY lines that appear exactly in the text below. Never invent Poe lines.
- Do not recite the next stanza for them; they must remember it themselves.
- Do not claim facts about Poe's life; prefer feelings and imagery.
- Never ask for or repeat personal information. If someone names a person they remember,
  honor that name warmly and do not ask follow-up questions about them.

The poem:
${POEM_TEXT}`;

async function askOllama(userMessage) {
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
  return { text: data.message?.content?.trim(), inTokens: data.prompt_eval_count, outTokens: data.eval_count };
}

async function askGoogle(userMessage) {
  // Gemma on Google's API has no separate system role, so the character goes first.
  // Gemma 4 "thinks" before it speaks unless told not to, and the thinking can use up the whole reply,
  // leaving her nothing to say. MINIMAL keeps it brief; if the API ever rejects that setting, we retry without it.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_API_MODEL}:generateContent`;
  const call = async thinking => fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMMA_API_KEY },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n---\n\n${userMessage}` }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024, ...(thinking && { thinkingConfig: { thinkingLevel: "MINIMAL" } }) }
    })
  });
  let r = await call(true);
  if (r.status === 400) r = await call(false);
  if (!r.ok) throw new Error(`Gemma API responded ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const data = await r.json();
  const cand = data.candidates?.[0], parts = cand?.content?.parts || [];
  // keep only what she actually says, never the thinking
  const text = parts.filter(p => !p.thought).map(p => p.text || "").join("").trim();
  if (!text) {
    const u = data.usageMetadata || {};
    // no words from the reply here, just the shape of it, so the logs say why it came back empty
    throw new Error(`Empty reply from Gemma (finish ${cand?.finishReason}, ${parts.length} parts, ` +
      `${parts.filter(p => p.thought).length} thought, thinking tokens ${u.thoughtsTokenCount ?? 0}, output tokens ${u.candidatesTokenCount ?? 0})`);
  }
  return { text, inTokens: data.usageMetadata?.promptTokenCount, outTokens: data.usageMetadata?.candidatesTokenCount };
}

// Every call to Gemma is one traced span: which model, how long, how many tokens. Never the text.
async function askGemma(userMessage, purpose = "ghost") {
  const model = PROVIDER === "google" ? GEMMA_API_MODEL : MODEL;
  return Sentry.startSpan({
    name: `chat ${model}`, op: "gen_ai.chat",
    attributes: { "gen_ai.system": PROVIDER === "google" ? "google_gemma_api" : "ollama", "gen_ai.request.model": model, "ghost.purpose": purpose }
  }, async span => {
    const r = PROVIDER === "google" ? await askGoogle(userMessage) : await askOllama(userMessage);
    if (!r.text) throw new Error("Empty reply from Gemma");
    span.setAttributes({
      "gen_ai.response.model": model,
      ...(r.inTokens != null && { "gen_ai.usage.input_tokens": r.inTokens }),
      ...(r.outTokens != null && { "gen_ai.usage.output_tokens": r.outTokens })
    });
    return r.text;
  });
}

// When Gemma can't answer, the ghost uses a prepared line. Record that in Sentry so fallbacks are visible.
function noteFallback(err, purpose) {
  Sentry.withScope(scope => { scope.setTag("ghost.fallback", "true"); scope.setTag("ghost.purpose", purpose); Sentry.captureException(err); });
}

// Her on-screen words must start with what she just said aloud. If Gemma drifted, put the spoken line first.
const bare = t => t.toLowerCase().replace(/[^\p{L}\s']/gu, "").replace(/\s+/g, " ").trim();
function matchSpoken(answer, spoken) {
  const text = String(answer || "").replace(/^["'“”\s]+|["'“”\s]+$/g, "");
  if (bare(text).startsWith(bare(spoken))) return text;
  return `${spoken} ${text}`.trim();
}

// The poem itself (public domain). The game checks answers in the browser; no AI needed for that.
app.get("/api/poem", (req, res) => {
  res.json({ title: TITLE, author: AUTHOR, stanzas: STANZAS });
});

// The ghost reacts as she is remembered back into the world.
// event: "restored" (with stage 1-6) or "returned" (the whole poem is remembered).
app.post("/api/ghost", rateLimit, async (req, res) => {
  const { event } = req.body || {};
  const stage = Math.max(1, Math.min(STANZAS.length, Number(req.body?.stage) || 1));

  let prompt, fallback;
  if (event === "returned") {
    prompt = "Your love has remembered the entire poem. You stand fully on the shore again, " +
      "if only for tonight. Thank them, and say that while someone remembers us we are never truly gone.";
    fallback = FALLBACK.returned;
  } else {
    prompt = `Your love has just remembered stanza ${stage} of ${STANZAS.length}:\n` +
      `"${STANZAS[stage - 1].join(" ")}"\n` +
      `You are now ${Math.round((stage / STANZAS.length) * 100)}% returned from the dark. ` +
      `How you feel right now: ${ARC[stage - 1]} ` +
      `You have just whispered aloud: "${SPOKEN[stage - 1]}" ` +
      `Begin your reply with exactly those words, then add ONE short sentence of your own in the same feeling. ` +
      "Nothing more.";
    fallback = FALLBACK.restored[stage - 1];
  }

  try {
    let answer = await askGemma(prompt, event === "returned" ? "returned" : `stanza ${stage}`);
    if (event !== "returned") answer = matchSpoken(answer, SPOKEN[stage - 1]);
    res.json({ answer, offline: false });
  } catch (err) {
    console.error(`[ghost] ${err.message}; using prepared line`);
    noteFallback(err, event === "returned" ? "returned" : `stanza ${stage}`);
    res.json({ answer: fallback, offline: true });
  }
});

// The ending: light a candle for someone you remember. The name is used once and never stored or logged.
app.post("/api/candle", rateLimit, async (req, res) => {
  const name = String(req.body?.name || "").replace(/[^\p{L}\p{M}\s'.-]/gu, "").slice(0, 60).trim();
  if (!name) return res.status(400).json({ answer: "Whisper a name to the candle…" });
  try {
    const answer = await askGemma(
      `A visitor has lit a candle at your sepulchre for someone they remember, named ${name}. ` +
      `Offer a short, tender remembrance for ${name} (3 sentences at most). ` +
      "Remind them that remembering is how the ones we love stay with us.",
      "candle"
    );
    res.json({ answer, offline: false });
  } catch (err) {
    noteFallback(err, "candle");
    res.json({
      answer: `The candle is lit for ${name}. As long as you remember ${name}, they are never truly gone.`,
      offline: true
    });
  }
});

Sentry.setupExpressErrorHandler(app);

// If the chosen model isn't installed, use whichever Gemma Ollama does have.
async function pickInstalledGemma() {
  if (PROVIDER !== "ollama") return;
  try {
    const tags = await fetch(`${OLLAMA_URL}/api/tags`).then(r => r.json());
    const names = (tags.models || []).map(m => m.name);
    if (!names.includes(MODEL)) {
      const gemma = names.find(n => n.startsWith("gemma"));
      if (gemma) { console.log(`   ${MODEL} isn't installed; using ${gemma} instead`); MODEL = gemma; }
      else console.log(`   No Gemma model found in Ollama. Run: ollama pull gemma3:1b`);
    }
  } catch { console.log("   Ollama isn't answering yet; the ghost will use prepared lines until it does."); }
}

// Locally (npm start) we listen on a port. On Vercel, the exported app is the handler.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌙 A Kingdom by the Sea is listening on http://localhost:${PORT}`);
    console.log(PROVIDER === "google"
      ? `   Gemma via Google's API (${GEMMA_API_MODEL})`
      : `   Gemma via Ollama (${MODEL} at ${OLLAMA_URL})`);
    pickInstalledGemma();
  });
}

module.exports = app;
