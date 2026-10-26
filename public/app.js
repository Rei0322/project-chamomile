// A Kingdom by the Sea: front end.
// Draws the moonlit shore on a canvas, fakes a Shockwave loading bar,
// and sends hotspot clicks to the server (which talks to Gemma).

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const quietBox = document.getElementById("quiet");
quietBox.checked = reducedMotion.matches;
const isQuiet = () => quietBox.checked;

// ---------- Loading screen ----------
const fill = document.getElementById("fill");
const pct = document.getElementById("pct");
let progress = 0;
function tickLoader() {
  progress = Math.min(100, progress + (isQuiet() ? 100 : Math.random() * 9));
  fill.style.width = progress + "%";
  pct.textContent = `Loading… ${Math.floor(progress)}%`;
  if (progress < 100) setTimeout(tickLoader, 90);
  else setTimeout(start, isQuiet() ? 0 : 400);
}
tickLoader();

function start() {
  document.getElementById("loader").hidden = true;
  document.getElementById("stage").hidden = false;
  requestAnimationFrame(draw);
}

// ---------- The scene ----------
const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;
const stars = Array.from({ length: 70 }, () => ({
  x: Math.random() * W, y: Math.random() * H * 0.45, r: Math.random() * 1.6 + 0.4, p: Math.random() * Math.PI * 2
}));

function draw(t = 0) {
  const time = isQuiet() ? 0 : t / 1000;

  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  sky.addColorStop(0, "#050816"); sky.addColorStop(1, "#1c2550");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  // stars
  for (const s of stars) {
    ctx.globalAlpha = 0.55 + 0.45 * Math.sin(time * 1.5 + s.p);
    ctx.fillStyle = "#f3ecd2";
    ctx.fillRect(Math.round(s.x), Math.round(s.y), s.r, s.r);
  }
  ctx.globalAlpha = 1;

  // moon
  ctx.fillStyle = "#f3ecd2";
  ctx.beginPath(); ctx.arc(W * 0.79, H * 0.2, 38, 0, Math.PI * 2); ctx.fill();

  // sepulchre (a simple tomb shape; replace with your own art)
  ctx.fillStyle = "#3a3f5c";
  ctx.fillRect(W * 0.43, H * 0.42, W * 0.14, H * 0.2);
  ctx.beginPath();
  ctx.moveTo(W * 0.42, H * 0.42); ctx.lineTo(W * 0.5, H * 0.34); ctx.lineTo(W * 0.58, H * 0.42); ctx.fill();
  ctx.fillStyle = "#1a1d33"; ctx.fillRect(W * 0.485, H * 0.5, W * 0.03, H * 0.12);

  // sea (slow tide)
  for (let i = 0; i < 6; i++) {
    const y = H * 0.62 + i * 30;
    ctx.fillStyle = i % 2 ? "#14204a" : "#1b2b5e";
    ctx.beginPath(); ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 20) {
      ctx.lineTo(x, y + Math.sin(x / 60 + time * 0.8 + i) * 4);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  }
  // moon reflection
  ctx.globalAlpha = 0.25; ctx.fillStyle = "#f3ecd2";
  ctx.fillRect(W * 0.77, H * 0.63, 30, H * 0.35);
  ctx.globalAlpha = 1;

  requestAnimationFrame(draw);
}

// ---------- Hotspots + ghost ----------
const stanzaEl = document.getElementById("stanza");
const ghostEl = document.getElementById("ghost");
const candleForm = document.getElementById("candle");

async function wake(spot) {
  const s = await fetch(`/api/stanza/${spot}`).then(r => r.json());
  stanzaEl.textContent = s.lines.join("\n");
  ghostEl.textContent = "…";
  const g = await fetch("/api/ghost", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hotspot: spot })
  }).then(r => r.json());
  ghostEl.textContent = g.answer;
  candleForm.hidden = spot !== "sepulchre";
}

document.querySelectorAll(".hotspot").forEach(btn =>
  btn.addEventListener("click", () => wake(btn.dataset.spot))
);

candleForm.addEventListener("submit", async e => {
  e.preventDefault();
  const input = document.getElementById("name");
  const name = input.value.trim();
  if (!name) return;
  ghostEl.textContent = "🕯️ …";
  const g = await fetch("/api/candle", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  }).then(r => r.json());
  ghostEl.textContent = g.answer;
  input.value = "";
});
