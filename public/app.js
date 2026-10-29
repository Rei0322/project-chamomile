// A Kingdom by the Sea: front end.
// You call Annabel Lee back by remembering the poem. Each stanza you finish brings her
// further out of the dark; if her light runs out, she fades away again (like being forgotten).

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const $ = id => document.getElementById(id);
const quietBox = $("quiet"), gentleBox = $("gentle");
quietBox.checked = reducedMotion.matches;
const vintageBox = $("vintage");
const isVintage = () => vintageBox.checked;
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
// Draw in an 800x500 coordinate space, rendered at the canvas's real (higher) resolution.
const W = 800, H = 450;
ctx.scale(canvas.width / W, canvas.height / H);

// Where things sit. The painted shore has its tomb and path in different spots than the drawn one.
const LAYOUT = {
  drawn:   { ghostX: 0.66, ghostY: 0.36, ghostH: 0.5, path: [[0.12, 0.69], [0.50, 0.60]], candles: [0.44, 0.60] },
  painted: { ghostX: 0.56, ghostY: 0.25, ghostH: 0.52, path: [[0.07, 0.97], [0.33, 0.61]], candles: [0.30, 0.62] }
};
const layout = () => (art.shore ? LAYOUT.painted : LAYOUT.drawn);

// Optional painted art. Drop files into public/art/ and the scene uses them automatically.
const art = {};
for (const [key, file] of [["shore", "art/shore.jpg"], ["ghost", "art/ghost.png"]]) {
  const img = new Image();
  img.onload = () => { art[key] = img; art[key + "Vintage"] = vintageCopy(img); };
  img.src = file;
}
// A 2000s-web version of an image: fewer colors with ordered dithering, like an old GIF.
function vintageCopy(img) {
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const x = c.getContext("2d"); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), px = d.data;
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const levels = 6, step = 255 / (levels - 1);
  for (let i = 0; i < px.length; i += 4) {
    const p = i / 4, bx = p % c.width, by = (p / c.width) | 0;
    const t = (bayer[(by % 4) * 4 + (bx % 4)] / 16 - 0.5) * step;
    for (let ch = 0; ch < 3; ch++) px[i + ch] = Math.round((px[i + ch] + t) / step) * step;
  }
  x.putImageData(d, 0, 0);
  return c;
}
const pic = key => (isVintage() && art[key + "Vintage"]) || art[key];

// Film grain + faint scanlines + vignette, drawn over everything in vintage mode.
const grain = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d"), d = x.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; }
  x.putImageData(d, 0, 0); return c;
})();
function drawVintageOverlay(time) {
  ctx.save();
  ctx.translate(-((time * 97) % 128), -((time * 61) % 128));
  ctx.fillStyle = ctx.createPattern(grain, "repeat");
  ctx.fillRect(0, 0, W + 128, H + 128);
  ctx.restore();
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.65);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// Optional looping video of the shore (art/shore.mp4). If it plays, it replaces the still painting.
const shoreVideo = Object.assign(document.createElement("video"), { muted: true, loop: true, playsInline: true, src: "art/shore.mp4" });
shoreVideo.addEventListener("canplay", () => { art.video = shoreVideo; shoreVideo.play().catch(() => {}); });

// Living details for the painted scene.
const rand = (a, b) => a + Math.random() * (b - a);
const glints = Array.from({ length: 70 }, () => ({ x: rand(0.62, 0.95), y: rand(0.61, 0.9), w: rand(4, 14), p: rand(0, 6.3), v: rand(0.6, 1.6) }));
const mist = Array.from({ length: 7 }, (_, i) => ({ x: rand(0, 1), y: rand(0.62, 0.95), r: rand(70, 150), v: rand(0.004, 0.012) * (i % 2 ? 1 : -1) }));
const motes = Array.from({ length: 40 }, () => ({ x: rand(0.05, 0.95), y: rand(0.3, 0.95), r: rand(0.8, 2), v: rand(4, 12), p: rand(0, 6.3), gold: Math.random() < 0.4 }));
const stars = Array.from({ length: 80 }, () => ({
  x: Math.random() * W, y: Math.random() * H * 0.45, r: Math.random() * 1.6 + 0.4, p: Math.random() * Math.PI * 2
}));
// Marigold petals light the path to the sepulchre, one handful per stanza remembered.
const petals = Array.from({ length: 48 }, (_, i) => ({
  t: i / 48, off: (Math.random() - 0.5) * 26, r: Math.random() * 2 + 2, p: Math.random() * Math.PI * 2
}));

const FPS = 12;   // Flash games often ran at 12 frames a second: motion in little steps
let lastStep = -1;
function draw(t = 0) {
  const step = Math.floor(t / 1000 * FPS);
  if (step === lastStep) { requestAnimationFrame(draw); return; }
  lastStep = step;
  const time = isQuiet() ? 0 : step / FPS;
  const total = poem ? poem.stanzas.length : 6;
  const memory = game.remembered / total;   // how much of the world has come back
  const light = game.light / 100;

  if (art.shore) { drawPainted(time, memory, light); requestAnimationFrame(draw); return; }

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
    const [[x0, y0], [x1, y1]] = layout().path;
    const x = W * (x0 + (x1 - x0) * pt.t) + pt.off;
    const y = H * (y0 + (y1 - y0) * pt.t) + Math.sin(time + pt.p) * 1.2;
    ctx.fillStyle = i % 3 ? "#f2a33a" : "#e07b24";
    ctx.beginPath(); ctx.arc(x, y, pt.r, 0, Math.PI * 2); ctx.fill();
  }

  // candles lit at the end
  for (let i = 0; i < Math.min(candles, 7); i++) {
    const x = W * (layout().candles[0] + i * 0.02), y = H * layout().candles[1];
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

// The painted version of the scene: artwork underneath, living effects on top.
function drawPainted(time, memory, light) {
  ctx.drawImage(art.video || pic("shore"), 0, 0, W, H);
  if (!art.video) { if (!isQuiet()) livePainting(time); drawWater(time); }
  // the world dims while she's forgotten and brightens as she returns
  ctx.fillStyle = `rgba(5, 8, 22, ${0.45 * (1 - memory)})`;
  ctx.fillRect(0, 0, W, H);
  const visible = Math.floor(stars.length * (0.35 + 0.65 * memory));
  for (let i = 0; i < visible; i++) {
    const s = stars[i];
    ctx.globalAlpha = 0.25 + 0.35 * Math.sin(time * 1.5 + s.p);
    ctx.fillStyle = "#f3ecd2";
    ctx.fillRect(s.x, s.y * 0.8, s.r, s.r);
  }
  ctx.globalAlpha = 1;
  drawPetalsAndCandles(time, memory);
  drawGhost(time, memory, light);
  drawMotes(time, memory);
  drawMist(time);
  if (isVintage()) drawVintageOverlay(time);
}

// Bring the still painting to life: the sea rolls in slow waves and the tall grass sways.
// Each thin strip of the painting is nudged sideways by a gentle wave.
function livePainting(time) {
  const img = pic("shore"), k = img.width / W;
  // sea: from the horizon down, to the right of the shore
  for (let y = H * 0.6; y < H; y += 2) {
    const depth = (y - H * 0.6) / (H * 0.4);              // waves grow toward the viewer
    const dx = Math.sin(y * 0.11 - time * 1.1) * (0.6 + 2.2 * depth) + Math.sin(y * 0.031 + time * 0.5) * depth * 1.5;
    const x0 = W * 0.46;
    ctx.drawImage(img, x0 * k, y * k, (W - x0) * k, 2 * k, x0 + dx, y, W - x0 + 3, 2);
  }
  // the tall grass at the left edge bends in the sea wind; tips move most, roots stay put
  for (let y = H * 0.62; y < H; y += 2) {
    const tip = 1 - (y - H * 0.62) / (H * 0.38);
    const dx = (Math.sin(time * 1.3 + y * 0.02) * 2.4 + Math.sin(time * 2.1) * 0.8) * tip * tip;
    ctx.drawImage(img, 0, y * k, W * 0.13 * k, 2 * k, dx, y, W * 0.13, 2);
  }
}

// Moonlight glinting on the water: little bright dashes that shimmer and drift.
function drawWater(time) {
  for (const g of glints) {
    const a = Math.max(0, Math.sin(time * g.v + g.p));
    if (a < 0.05) continue;
    const drift = Math.sin(time * 0.3 + g.p) * 6;
    ctx.globalAlpha = a * 0.7;
    ctx.fillStyle = "#fff6dc";
    ctx.fillRect(W * g.x + drift, H * g.y, g.w * (0.5 + a / 2), 1.4);
  }
  ctx.globalAlpha = 1;
}

// Sea mist rolling slowly across the shore.
function drawMist(time) {
  for (const m of mist) {
    const x = ((m.x + time * m.v) % 1.3 + 1.3) % 1.3 - 0.15;
    const g = ctx.createRadialGradient(W * x, H * m.y, 0, W * x, H * m.y, m.r);
    g.addColorStop(0, "rgba(200,215,235,0.09)"); g.addColorStop(1, "rgba(200,215,235,0)");
    ctx.fillStyle = g; ctx.fillRect(W * x - m.r, H * m.y - m.r, m.r * 2, m.r * 2);
  }
}

// Glowing motes rising slowly; more appear as she is remembered.
function drawMotes(time, memory) {
  const n = Math.floor(motes.length * (0.25 + 0.75 * memory));
  for (let i = 0; i < n; i++) {
    const m = motes[i];
    const y = H * m.y - ((time * m.v) % (H * 0.7));
    const yy = y < H * 0.2 ? y + H * 0.7 : y;
    const x = W * m.x + Math.sin(time * 0.8 + m.p) * 8;
    const a = 0.35 + 0.45 * Math.sin(time * 2 + m.p);
    const col = m.gold ? "242,190,110" : "180,235,190";
    const g = ctx.createRadialGradient(x, yy, 0, x, yy, m.r * 5);
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - m.r * 5, yy - m.r * 5, m.r * 10, m.r * 10);
  }
}

function drawPetalsAndCandles(time, memory) {
  const lit = Math.floor(petals.length * memory);
  for (let i = 0; i < lit; i++) {
    const pt = petals[i];
    const [[x0, y0], [x1, y1]] = layout().path;
    const x = W * (x0 + (x1 - x0) * pt.t) + pt.off;
    const y = H * (y0 + (y1 - y0) * pt.t) + Math.sin(time + pt.p) * 1.2;
    ctx.fillStyle = i % 3 ? "#f2a33a" : "#e07b24";
    ctx.beginPath(); ctx.arc(x, y, pt.r, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < Math.min(candles, 7); i++) {
    const x = W * (layout().candles[0] + i * 0.02), y = H * layout().candles[1];
    ctx.fillStyle = "#e8e2d0"; ctx.fillRect(x, y - 10, 4, 10);
    ctx.fillStyle = "#f2a33a"; ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 6 + i);
    ctx.beginPath(); ctx.arc(x + 2, y - 13, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
}

// Annabel Lee: a pale arsenic-green figure beside her tomb.
// She grows more solid with every stanza, and dims as her light drains.
function drawGhost(time, memory, light) {
  if (game.remembered === 0 && !game.choosing) return;
  game.flicker = Math.max(0, game.flicker - 0.03);
  let alpha = (0.15 + 0.75 * memory) * (0.35 + 0.65 * light);
  if (game.flicker) alpha *= 0.5 + 0.5 * Math.sin(time * 40);
  const L = layout();
  const x = W * L.ghostX, y = H * L.ghostY + Math.sin(time * 1.2) * 3;

  if (art.ghost) {
    const gh = H * L.ghostH, gw = gh * art.ghost.width / art.ghost.height;
    const glowG = ctx.createRadialGradient(x, y + gh * 0.45, 6, x, y + gh * 0.45, gh * 0.8);
    glowG.addColorStop(0, `rgba(159,216,168,${0.4 * alpha})`);
    glowG.addColorStop(1, "rgba(159,216,168,0)");
    ctx.fillStyle = glowG; ctx.fillRect(x - gh, y - gh * 0.4, gh * 2, gh * 1.8);
    // she sways and breathes, as if the sea wind moves her
    const sway = Math.sin(time * 0.7) * 0.018, breathe = 1 + Math.sin(time * 1.1) * 0.012;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway);
    ctx.scale(breathe, breathe);
    ctx.globalAlpha = alpha * (0.88 + 0.12 * Math.sin(time * 1.7));
    ctx.drawImage(pic("ghost"), -gw / 2, 0, gw, gh);
    ctx.restore();
    // mist curling at her hem
    for (let i = 0; i < 4; i++) {
      const hx = x + Math.sin(time * 0.9 + i * 1.7) * gw * 0.35, hy = y + gh * (0.9 + 0.04 * Math.sin(time + i));
      const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, gw * 0.45);
      hg.addColorStop(0, `rgba(190,235,200,${0.18 * alpha})`); hg.addColorStop(1, "rgba(190,235,200,0)");
      ctx.fillStyle = hg; ctx.fillRect(hx - gw * 0.45, hy - gw * 0.45, gw * 0.9, gw * 0.9);
    }
    ctx.globalAlpha = 1;
    return;
  }

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
