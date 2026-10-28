// A Kingdom by the Sea: front end.
// You call Annabel Lee back by remembering the poem. Each stanza you finish brings her
// further out of the dark; if her light runs out, she fades away again (like being forgotten).

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const $ = id => document.getElementById(id);
const quietBox = $("quiet"), gentleBox = $("gentle");
quietBox.checked = reducedMotion.matches;
const isQuiet = () => quietBox.checked;
const isGentle = () => gentleBox.checked;

// ---------- Game state ----------
const START_LIGHT = 60;   // seconds of light before the first stanza is lost
const DRAIN_PER_SEC = 1;  // light lost per second while you're choosing
const REWARD = 25;        // light returned for each stanza remembered
const PENALTY = 15;       // light lost for a wrong line
let poem = null;
const game = { stanza: 0, remembered: 0, light: START_LIGHT, choosing: false, over: false, flicker: 0 };

// ---------- Loading screen ----------
let progress = 0;
function tickLoader() {
  progress = Math.min(100, progress + (isQuiet() ? 100 : Math.random() * 9));
  $("fill").style.width = progress + "%";
  $("pct").textContent = `Loading… ${Math.floor(progress)}%`;
  if (progress < 100) setTimeout(tickLoader, 90);
  else setTimeout(start, isQuiet() ? 0 : 400);
}
tickLoader();

async function start() {
  poem = await fetch("/api/poem").then(r => r.json());
  $("loader").hidden = true;
  $("stage").hidden = false;
  requestAnimationFrame(draw);
  setInterval(drain, 100);
  updateMeter();
}

// ---------- Recitation ----------
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(p => p[1]);

function distractors(correct, stanzaIndex) {
  const pool = poem.stanzas.flatMap((s, i) => (i === stanzaIndex ? [] : s))
    .filter(line => line !== correct && !poem.stanzas[stanzaIndex].includes(line));
  return shuffle([...new Set(pool)]).slice(0, 2);
}

function showStanza() {
  const lines = poem.stanzas[game.stanza];
  const missing = lines[lines.length - 1];
  const stanzaEl = $("stanza");
  stanzaEl.hidden = false;
  stanzaEl.innerHTML = "";
  const shown = lines.slice(0, -1);
  shown.forEach((line, i) => {
    const span = document.createElement("span");
    span.textContent = line + "\n";
    if (!isQuiet()) { span.style.opacity = 0; setTimeout(() => (span.style.opacity = 1), i * 350); }
    stanzaEl.appendChild(span);
  });
  const blank = document.createElement("span");
  blank.className = "missing";
  blank.id = "blank";
  blank.textContent = "…";
  stanzaEl.appendChild(blank);

  const box = $("choices");
  box.innerHTML = "";
  shuffle([missing, ...distractors(missing, game.stanza)]).forEach(text => {
    const b = document.createElement("button");
    b.textContent = text;
    b.addEventListener("click", () => choose(b, text === missing, missing));
    box.appendChild(b);
  });
  box.hidden = false;
  $("next").hidden = true;
  game.choosing = true;
  box.querySelector("button").focus({ preventScroll: true });
}

async function choose(button, correct, missingLine) {
  if (!game.choosing) return;
  if (!correct) {
    button.disabled = true;
    game.light = Math.max(0, game.light - PENALTY);
    game.flicker = 1;
    say(pick(["That isn't how it goes… the words are slipping…",
              "No… I'm fading… try again, my love.",
              "The fog is closing in. Remember it truly."]));
    updateMeter();
    if (game.light <= 0) fade();
    return;
  }
  game.choosing = false;
  $("choices").hidden = true;
  $("stanza").querySelectorAll("span").forEach(s => (s.style.opacity = 1));
  $("blank").textContent = missingLine;
  game.remembered++;
  game.light = Math.min(100, game.light + REWARD);
  updateMeter();
  say("…", false);
  const g = await ghost({ event: "restored", stage: game.remembered });
  say(g.answer, g.offline);
  if (game.remembered === poem.stanzas.length) return returned();
  game.stanza++;
  $("next").hidden = false;
  $("next").focus({ preventScroll: true });
}

async function returned() {
  game.over = true;
  game.light = 100;
  updateMeter();
  const g = await ghost({ event: "returned" });
  say(g.answer, g.offline);
  $("candle").hidden = false;
}

function fade() {
  game.choosing = false;
  game.over = true;
  $("choices").hidden = true;
  say("Her light goes out, and the sea takes her back. No one remembered her in time… but memory can always call her again.");
  $("again").hidden = false;
  $("again").focus({ preventScroll: true });
}

function reset() {
  Object.assign(game, { stanza: 0, remembered: 0, light: START_LIGHT, choosing: false, over: false });
  $("again").hidden = true;
  $("candle").hidden = true;
  say("");
  updateMeter();
  showStanza();
}

// Light drains only while you're choosing (never while the ghost is speaking).
function drain() {
  if (!game.choosing || isGentle()) return;
  game.light = Math.max(0, game.light - DRAIN_PER_SEC / 10);
  updateMeter();
  if (game.light <= 0) fade();
}

let lastAria = -1;
function updateMeter() {
  $("meterFill").style.width = game.light + "%";
  $("meterFill").classList.toggle("low", game.light < 25);
  const rounded = Math.round(game.light / 10) * 10;
  if (rounded !== lastAria) { $("meter").setAttribute("aria-valuenow", rounded); lastAria = rounded; }
  $("count").textContent = `${game.remembered} / ${poem ? poem.stanzas.length : 6} remembered`;
}

const pick = a => a[Math.floor(Math.random() * a.length)];
function say(text, offline = false) {
  $("ghost").textContent = text;
  $("ghost").classList.toggle("offline", !!offline);
}
async function ghost(body) {
  try {
    return await fetch("/api/ghost", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    }).then(r => r.json());
  } catch { return { answer: "…", offline: true }; }
}

$("begin").addEventListener("click", () => { $("intro").hidden = true; showStanza(); });
$("next").addEventListener("click", showStanza);
$("again").addEventListener("click", reset);

$("candle").addEventListener("submit", async e => {
  e.preventDefault();
  const input = $("name");
  const name = input.value.trim();
  if (!name) return;
  say("🕯️ …");
  const g = await fetch("/api/candle", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name })
  }).then(r => r.json()).catch(() => ({ answer: `The candle is lit for ${name}.`, offline: true }));
  say(g.answer, g.offline);
  candles++;
  input.value = "";
});
let candles = 0;

// ---------- The scene ----------
const canvas = $("scene");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;
const stars = Array.from({ length: 80 }, () => ({
  x: Math.random() * W, y: Math.random() * H * 0.45, r: Math.random() * 1.6 + 0.4, p: Math.random() * Math.PI * 2
}));
// Marigold petals light the path to the sepulchre, one handful per stanza remembered.
const petals = Array.from({ length: 48 }, (_, i) => ({
  t: i / 48, off: (Math.random() - 0.5) * 26, r: Math.random() * 2 + 2, p: Math.random() * Math.PI * 2
}));

function draw(t = 0) {
  const time = isQuiet() ? 0 : t / 1000;
  const total = poem ? poem.stanzas.length : 6;
  const memory = game.remembered / total;   // how much of the world has come back
  const light = game.light / 100;

  // sky (brightens a little as she is remembered)
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  sky.addColorStop(0, "#050816"); sky.addColorStop(1, memory > 0.5 ? "#243063" : "#1c2550");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  // stars: more of them appear as the poem returns
  const visible = Math.floor(stars.length * (0.35 + 0.65 * memory));
  for (let i = 0; i < visible; i++) {
    const s = stars[i];
    ctx.globalAlpha = 0.55 + 0.45 * Math.sin(time * 1.5 + s.p);
    ctx.fillStyle = "#f3ecd2";
    ctx.fillRect(Math.round(s.x), Math.round(s.y), s.r, s.r);
  }
  ctx.globalAlpha = 1;

  // moon
  ctx.fillStyle = "#f3ecd2";
  ctx.globalAlpha = 0.6 + 0.4 * memory;
  ctx.beginPath(); ctx.arc(W * 0.79, H * 0.2, 38, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // shore
  ctx.fillStyle = "#1f2440";
  ctx.beginPath(); ctx.moveTo(0, H * 0.6); ctx.lineTo(W, H * 0.56); ctx.lineTo(W, H * 0.66); ctx.lineTo(0, H * 0.7); ctx.fill();

  // sepulchre
  ctx.fillStyle = "#3a3f5c";
  ctx.fillRect(W * 0.43, H * 0.4, W * 0.14, H * 0.2);
  ctx.beginPath();
  ctx.moveTo(W * 0.42, H * 0.4); ctx.lineTo(W * 0.5, H * 0.32); ctx.lineTo(W * 0.58, H * 0.4); ctx.fill();
  ctx.fillStyle = "#1a1d33"; ctx.fillRect(W * 0.485, H * 0.48, W * 0.03, H * 0.12);

  // marigold path from the viewer to the tomb
  const lit = Math.floor(petals.length * memory);
  for (let i = 0; i < lit; i++) {
    const pt = petals[i];
    const x = W * (0.12 + 0.38 * pt.t) + pt.off;
    const y = H * (0.69 - 0.09 * pt.t) + Math.sin(time + pt.p) * 1.2;
    ctx.fillStyle = i % 3 ? "#f2a33a" : "#e07b24";
    ctx.beginPath(); ctx.arc(x, y, pt.r, 0, Math.PI * 2); ctx.fill();
  }

  // candles lit at the end
  for (let i = 0; i < Math.min(candles, 7); i++) {
    const x = W * (0.44 + i * 0.02), y = H * 0.6;
    ctx.fillStyle = "#e8e2d0"; ctx.fillRect(x, y - 10, 4, 10);
    ctx.fillStyle = "#f2a33a"; ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 6 + i);
    ctx.beginPath(); ctx.arc(x + 2, y - 13, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }

  drawGhost(time, memory, light);

  // sea (slow tide)
  for (let i = 0; i < 6; i++) {
    const y = H * 0.66 + i * 28;
    ctx.fillStyle = i % 2 ? "#14204a" : "#1b2b5e";
    ctx.beginPath(); ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin(x / 60 + time * 0.8 + i) * 4);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  }
  // moon reflection
  ctx.globalAlpha = 0.15 + 0.15 * memory; ctx.fillStyle = "#f3ecd2";
  ctx.fillRect(W * 0.77, H * 0.67, 30, H * 0.33);
  ctx.globalAlpha = 1;

  requestAnimationFrame(draw);
}

// Annabel Lee: a pale arsenic-green figure beside her tomb.
// She grows more solid with every stanza, and dims as her light drains.
function drawGhost(time, memory, light) {
  if (game.remembered === 0 && !game.choosing) return;
  game.flicker = Math.max(0, game.flicker - 0.03);
  let alpha = (0.15 + 0.75 * memory) * (0.35 + 0.65 * light);
  if (game.flicker) alpha *= 0.5 + 0.5 * Math.sin(time * 40);
  const x = W * 0.66, y = H * 0.36 + Math.sin(time * 1.2) * 3;

  // glow
  const glow = ctx.createRadialGradient(x, y + 40, 4, x, y + 40, 90);
  glow.addColorStop(0, `rgba(159,216,168,${0.45 * alpha})`);
  glow.addColorStop(1, "rgba(159,216,168,0)");
  ctx.fillStyle = glow; ctx.fillRect(x - 100, y - 60, 200, 220);

  ctx.globalAlpha = alpha;
  // gown, drifting at the hem
  ctx.fillStyle = "#3f7d4f";
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 20);
  ctx.quadraticCurveTo(x - 34, y + 70, x - 30 + Math.sin(time * 2) * 4, y + 112);
  ctx.lineTo(x + 30 + Math.sin(time * 2 + 1) * 4, y + 112);
  ctx.quadraticCurveTo(x + 34, y + 70, x + 10, y + 20);
  ctx.fill();
  // veil + face
  ctx.fillStyle = "#9fd8a8";
  ctx.beginPath(); ctx.arc(x, y + 8, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 13, y + 6); ctx.quadraticCurveTo(x - 24, y + 50, x - 18, y + 80);
  ctx.lineTo(x - 8, y + 30); ctx.fill();
  ctx.globalAlpha = 1;
}
