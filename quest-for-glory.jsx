import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SALEM_CENTER = [44.9429, -123.0351];
const TOTAL_LOCATIONS = 10;
const STORAGE_KEYS = {
  ADMIN_DATA: "qfg_admin_data",
  TEAMS: "qfg_teams",
  CURRENT_TEAM: "qfg_current_team",
  CRYPTIC: "qfg_cryptic",
};

const DEFAULT_LOCATIONS = [
  { name: "Willamette University", lat: 44.9383, lng: -123.0338 },
  { name: "Salem Capitol Building", lat: 44.9383, lng: -123.0306 },
  { name: "Salem Public Library", lat: 44.9413, lng: -123.0368 },
  { name: "Riverfront Park", lat: 44.9431, lng: -123.0498 },
  { name: "Elsinore Theatre", lat: 44.9424, lng: -123.0358 },
  { name: "Reed Opera House", lat: 44.9416, lng: -123.0371 },
  { name: "Hallie Ford Museum", lat: 44.9378, lng: -123.0342 },
  { name: "Bush's Pasture Park", lat: 44.9289, lng: -123.0355 },
  { name: "Salem Saturday Market", lat: 44.9412, lng: -123.0499 },
  { name: "Historic Downtown Square", lat: 44.9418, lng: -123.038 },
];

const DEFAULT_ADMIN = {
  locations: DEFAULT_LOCATIONS.map((loc, i) => ({
    ...loc,
    hints: [
      `A mystical landmark of great renown in Salem awaits thee, adventurer. Seek the ${loc.name}.`,
      `The enchanted map reveals: venture toward the heart of the city. Clue the second: thou art near.`,
      `Heed this final riddle: stand at the very entrance of ${loc.name} and claim thy glory!`,
    ],
    radius: 150,
  })),
};

const DEFAULT_CRYPTIC =
  "The path less traveled reveals what the eyes cannot see. The brave soul who finds this message shall know: THE HIDDEN TREASURE LIES BENEATH THE OLDEST STONE IN SALEM. Speak the word GRAPEBISCUIT to the Dungeon Master to claim a secret reward. 🐉";

// ─── STYLES ───────────────────────────────────────────────────────────────────
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;600;700&family=Fondamento&display=swap');
`;

const globalStyles = `
  ${FONTS}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --parchment: #f4e4bc;
    --parchment-dark: #e8d49e;
    --ink: #1a0e00;
    --ink-mid: #3d2b00;
    --blood: #8b0000;
    --gold: #c8a84b;
    --gold-bright: #f0c040;
    --silver: #9ca3b0;
    --ember: #d4500a;
    --forest: #1a3a1a;
    --midnight: #0d0d1a;
    --shadow: rgba(0,0,0,0.7);
    --rune-glow: rgba(200,168,75,0.4);
  }

  html, body, #root { height: 100%; }
  
  body {
    font-family: 'Cinzel', Georgia, serif;
    background: var(--midnight);
    color: var(--parchment);
    min-height: 100vh;
    cursor: default;
  }

  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: 
      radial-gradient(ellipse at 20% 50%, rgba(139,0,0,0.08) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(200,168,75,0.06) 0%, transparent 50%),
      repeating-linear-gradient(
        0deg, transparent, transparent 60px,
        rgba(200,168,75,0.02) 60px, rgba(200,168,75,0.02) 61px
      ),
      repeating-linear-gradient(
        90deg, transparent, transparent 60px,
        rgba(200,168,75,0.02) 60px, rgba(200,168,75,0.02) 61px
      ),
      linear-gradient(180deg, #0a0a12 0%, #0d1020 50%, #080810 100%);
    position: relative;
  }

  .app-shell::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
  }

  .content-wrap {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* ── HEADER ── */
  .site-header {
    text-align: center;
    padding: 2rem 1rem 1rem;
    border-bottom: 1px solid rgba(200,168,75,0.3);
    background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%);
    position: relative;
    overflow: hidden;
  }

  .site-header::before {
    content: '⚔️';
    position: absolute; left: 2rem; top: 50%; transform: translateY(-50%);
    font-size: 2rem; opacity: 0.4;
  }
  .site-header::after {
    content: '⚔️';
    position: absolute; right: 2rem; top: 50%; transform: translateY(-50%) scaleX(-1);
    font-size: 2rem; opacity: 0.4;
  }

  .site-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: clamp(1.8rem, 6vw, 3.5rem);
    font-weight: 900;
    background: linear-gradient(180deg, #f0d070 0%, #c8a84b 40%, #8b6914 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: none;
    letter-spacing: 0.05em;
    line-height: 1.1;
    filter: drop-shadow(0 0 20px rgba(200,168,75,0.5));
  }

  .site-subtitle {
    font-family: 'Fondamento', cursive;
    color: var(--silver);
    font-size: 0.85rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    margin-top: 0.4rem;
    opacity: 0.8;
  }

  .header-rune {
    font-size: 1.5rem;
    color: var(--gold);
    opacity: 0.5;
    margin: 0 0.5rem;
  }

  /* ── MAIN CONTENT ── */
  .main-content {
    flex: 1;
    padding: 2rem 1rem;
    max-width: 900px;
    width: 100%;
    margin: 0 auto;
  }

  /* ── PARCHMENT CARD ── */
  .parchment {
    background: linear-gradient(135deg, #f5e6c8 0%, #ede0b8 30%, #e8d8a8 60%, #f0e2be 100%);
    border: 2px solid var(--gold);
    border-radius: 4px;
    padding: 2rem;
    color: var(--ink);
    position: relative;
    box-shadow:
      0 0 0 1px rgba(200,168,75,0.3),
      0 4px 24px rgba(0,0,0,0.6),
      inset 0 0 60px rgba(0,0,0,0.08);
  }

  .parchment::before {
    content: '';
    position: absolute;
    inset: 6px;
    border: 1px solid rgba(139,69,19,0.2);
    border-radius: 2px;
    pointer-events: none;
  }

  .parchment-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--ink);
    text-align: center;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(139,69,19,0.3);
    text-shadow: 1px 1px 0 rgba(255,255,255,0.4);
  }

  /* ── DARK CARD ── */
  .dark-card {
    background: linear-gradient(135deg, rgba(20,15,5,0.95), rgba(15,10,5,0.98));
    border: 1px solid rgba(200,168,75,0.4);
    border-radius: 4px;
    padding: 1.5rem;
    color: var(--parchment);
    box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(200,168,75,0.05);
  }

  .dark-card-title {
    font-family: 'Cinzel Decorative', serif;
    font-size: 1.1rem;
    color: var(--gold);
    margin-bottom: 1rem;
    text-align: center;
  }

  /* ── BUTTONS ── */
  .btn {
    font-family: 'Cinzel', serif;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 0.75rem 1.75rem;
    border: none;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%);
    pointer-events: none;
  }

  .btn-gold {
    background: linear-gradient(180deg, #d4a840 0%, #a07820 50%, #c09030 100%);
    color: var(--ink);
    box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 20px rgba(200,168,75,0.2);
    border: 1px solid rgba(255,200,60,0.4);
  }

  .btn-gold:hover {
    background: linear-gradient(180deg, #e4b850 0%, #b08830 50%, #d0a040 100%);
    box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 30px rgba(200,168,75,0.4);
    transform: translateY(-1px);
  }

  .btn-blood {
    background: linear-gradient(180deg, #aa1010 0%, #6b0000 50%, #880808 100%);
    color: var(--parchment);
    box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 20px rgba(139,0,0,0.2);
    border: 1px solid rgba(200,50,50,0.3);
  }

  .btn-blood:hover {
    background: linear-gradient(180deg, #cc2020 0%, #880808 50%, #aa1010 100%);
    box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 30px rgba(139,0,0,0.4);
    transform: translateY(-1px);
  }

  .btn-forest {
    background: linear-gradient(180deg, #2a5a2a 0%, #143014 50%, #1e481e 100%);
    color: #a8d8a8;
    border: 1px solid rgba(100,200,100,0.2);
  }

  .btn-forest:hover {
    background: linear-gradient(180deg, #3a7a3a 0%, #1a3a1a 50%, #2a5a2a 100%);
    transform: translateY(-1px);
  }

  .btn-sm { padding: 0.4rem 0.9rem; font-size: 0.75rem; }

  /* ── INPUTS ── */
  .field-group { margin-bottom: 1.25rem; }

  .field-label {
    display: block;
    font-family: 'Cinzel', serif;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-mid);
    margin-bottom: 0.4rem;
  }

  .dark-label { color: var(--gold) !important; }

  .field-input {
    width: 100%;
    padding: 0.6rem 0.9rem;
    font-family: 'Cinzel', serif;
    font-size: 0.9rem;
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(139,69,19,0.4);
    border-radius: 2px;
    color: var(--ink);
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .field-input:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 2px rgba(200,168,75,0.2);
    background: rgba(255,255,255,0.85);
  }

  .dark-input {
    background: rgba(10,8,4,0.6) !important;
    border-color: rgba(200,168,75,0.3) !important;
    color: var(--parchment) !important;
  }

  .dark-input:focus {
    border-color: var(--gold) !important;
    box-shadow: 0 0 0 2px rgba(200,168,75,0.15) !important;
  }

  textarea.field-input {
    resize: vertical;
    min-height: 80px;
    line-height: 1.5;
  }

  /* ── MAP ── */
  #quest-map {
    width: 100%;
    height: 420px;
    border: 2px solid var(--gold);
    border-radius: 2px;
    box-shadow: 0 0 30px rgba(0,0,0,0.5);
  }

  /* ── HINT BOX ── */
  .hint-box {
    background: rgba(139,69,19,0.15);
    border: 1px solid rgba(139,69,19,0.4);
    border-radius: 3px;
    padding: 1rem 1.25rem;
    margin-bottom: 0.75rem;
    font-family: 'Fondamento', cursive;
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--ink-mid);
    position: relative;
  }

  .hint-box::before {
    content: '◆';
    color: var(--gold);
    margin-right: 0.5rem;
    font-size: 0.7rem;
    vertical-align: middle;
  }

  /* ── PROGRESS ── */
  .progress-row {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    justify-content: center;
    margin: 1rem 0;
  }

  .progress-dot {
    width: 28px; height: 28px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
    border: 2px solid;
    transition: all 0.3s ease;
  }

  .dot-pending { border-color: rgba(200,168,75,0.3); color: rgba(200,168,75,0.4); background: transparent; }
  .dot-current { border-color: var(--gold); color: var(--ink); background: var(--gold); animation: pulseGold 1.5s ease infinite; }
  .dot-complete { border-color: #2a8a2a; color: #fff; background: #2a8a2a; }
  .dot-wrong { border-color: var(--blood); color: #fff; background: var(--blood); }

  @keyframes pulseGold {
    0%, 100% { box-shadow: 0 0 0 0 rgba(200,168,75,0.4); }
    50% { box-shadow: 0 0 0 6px rgba(200,168,75,0); }
  }

  /* ── FOOTER ── */
  .site-footer {
    text-align: center;
    padding: 1.2rem;
    border-top: 1px solid rgba(200,168,75,0.2);
    font-family: 'Fondamento', cursive;
    font-size: 0.8rem;
    color: rgba(200,168,75,0.5);
    background: rgba(0,0,0,0.3);
  }

  .footer-secret {
    color: inherit;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.3s;
  }

  .footer-secret:hover {
    color: rgba(200,168,75,0.9);
    text-shadow: 0 0 8px rgba(200,168,75,0.5);
  }

  /* ── MODAL ── */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

  .modal-box {
    max-width: 420px;
    width: 90%;
    text-align: center;
    animation: slideUp 0.3s ease;
  }

  .modal-icon { font-size: 3.5rem; margin-bottom: 1rem; }
  .modal-title { font-family: 'Cinzel Decorative', serif; font-size: 1.4rem; margin-bottom: 0.75rem; }
  .modal-msg { font-family: 'Fondamento', cursive; font-size: 1rem; line-height: 1.6; margin-bottom: 1.5rem; opacity: 0.9; }

  /* ── SCROLL ── */
  .scroll-reveal { animation: fadeIn 0.6s ease both; }

  /* ── ADMIN ── */
  .admin-nav {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .admin-tab {
    font-family: 'Cinzel', serif;
    font-size: 0.75rem;
    padding: 0.4rem 0.9rem;
    border: 1px solid rgba(200,168,75,0.3);
    background: transparent;
    color: var(--gold);
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.05em;
    border-radius: 2px;
  }

  .admin-tab.active, .admin-tab:hover {
    background: rgba(200,168,75,0.15);
    border-color: var(--gold);
  }

  .loc-card {
    border: 1px solid rgba(200,168,75,0.2);
    border-radius: 3px;
    padding: 1rem;
    margin-bottom: 1rem;
    background: rgba(200,168,75,0.04);
  }

  .loc-num {
    font-family: 'Cinzel Decorative', serif;
    font-size: 0.8rem;
    color: var(--gold);
    margin-bottom: 0.75rem;
    letter-spacing: 0.1em;
  }

  .divider {
    border: none;
    border-top: 1px solid rgba(200,168,75,0.2);
    margin: 1.5rem 0;
  }

  /* ── CRYPTIC PAGE ── */
  .cryptic-container {
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
    padding: 2rem;
    position: relative;
  }

  .cryptic-glyph {
    font-size: 4rem;
    margin-bottom: 1rem;
    filter: drop-shadow(0 0 20px rgba(200,168,75,0.6));
    animation: float 4s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }

  .cryptic-text {
    font-family: 'Fondamento', cursive;
    font-size: 1.1rem;
    line-height: 1.9;
    color: var(--gold);
    max-width: 560px;
    text-shadow: 0 0 20px rgba(200,168,75,0.3);
  }

  /* ── MEMBER TAGS ── */
  .member-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(139,69,19,0.2);
    border: 1px solid rgba(200,168,75,0.3);
    border-radius: 20px;
    padding: 0.25rem 0.6rem 0.25rem 0.8rem;
    font-size: 0.8rem;
    margin: 0.2rem;
    color: var(--ink);
  }

  .tag-remove {
    background: none; border: none; cursor: pointer;
    color: var(--blood); font-size: 1rem; line-height: 1;
    padding: 0; opacity: 0.7;
  }

  .tag-remove:hover { opacity: 1; }

  .members-area {
    min-height: 40px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.2rem;
    padding: 0.4rem;
    border: 1px dashed rgba(139,69,19,0.3);
    border-radius: 2px;
    background: rgba(255,255,255,0.3);
    margin-top: 0.4rem;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  @media (max-width: 600px) {
    .grid-2 { grid-template-columns: 1fr; }
    .site-header::before, .site-header::after { display: none; }
  }

  .text-center { text-align: center; }
  .mt-1 { margin-top: 0.75rem; }
  .mt-2 { margin-top: 1.5rem; }
  .mb-1 { margin-bottom: 0.75rem; }
  .flex-center { display: flex; justify-content: center; }
  .gap-1 { gap: 0.75rem; }
  .success-color { color: #2a8a2a; }
  .error-color { color: var(--blood); }
  .gold-text { color: var(--gold); }
  .small-text { font-size: 0.8rem; opacity: 0.7; }

  /* leaflet override */
  .leaflet-container { font-family: 'Cinzel', serif; }
  .leaflet-popup-content-wrapper {
    background: #1a1208 !important;
    color: var(--parchment) !important;
    border: 1px solid var(--gold) !important;
    border-radius: 2px !important;
  }
  .leaflet-popup-tip { background: #1a1208 !important; }
  .leaflet-popup-content { color: var(--parchment); font-family: 'Fondamento', cursive; font-size: 0.85rem; }
`;

// ─── UTILS ───────────────────────────────────────────────────────────────────
function getStorage(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function setStorage(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nowStamp() {
  const d = new Date();
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ─── LEAFLET LOADER ──────────────────────────────────────────────────────────
function useLeaflet(mapRef, setLeafletMap) {
  useEffect(() => {
    if (window.L) { initMap(); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = initMap;
    document.head.appendChild(script);

    function initMap() {
      if (!mapRef.current || mapRef.current._leaflet_id) return;
      const map = window.L.map(mapRef.current, { zoomControl: true }).setView(SALEM_CENTER, 15);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      setLeafletMap(map);
    }
  }, []);
}

// ─── EXPORT TO CSV (spreadsheet simulation) ──────────────────────────────────
function exportCSV(teams) {
  const headers = ["Team Name", "Members", "Start Time", "End Time", ...Array.from({length:10},(_,i)=>`Location ${i+1}`)];
  const rows = teams.map(t => [
    t.name,
    t.members.join("; "),
    t.startTime || "",
    t.endTime || "",
    ...Array.from({length:10},(_,i) => t.found?.[i] ? "✓" : ""),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "quest_for_glory_teams.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Header({ onAdmin }) {
  return (
    <header className="site-header">
      <div className="site-title">QUEST FOR gLORY</div>
      <div className="site-subtitle">
        <span className="header-rune">᛭</span>
        A Sacred Hunt Through the Realm of Salem
        <span className="header-rune">᛭</span>
      </div>
      <div style={{ position: "absolute", top: "0.5rem", right: "0.75rem" }}>
        <button className="btn btn-sm" onClick={onAdmin}
          style={{ background: "transparent", border: "1px solid rgba(200,168,75,0.3)", color: "rgba(200,168,75,0.5)", fontSize: "0.65rem", letterSpacing: "0.08em", fontFamily: "'Cinzel', serif", cursor: "pointer", padding: "0.25rem 0.5rem" }}>
          ⚙ Admin
        </button>
      </div>
    </header>
  );
}

function Footer({ onSecret }) {
  return (
    <footer className="site-footer">
      Created by{" "}
      <a className="footer-secret" onClick={onSecret} href="#">
        <span style={{ fontStyle: "italic" }}>g</span>
      </a>
      rapebiscuits © 2026
    </footer>
  );
}

function Modal({ icon, title, msg, color, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="parchment" style={{ background: "linear-gradient(135deg, #1a0e00, #0d0800)", color: "var(--parchment)" }}>
          <div className="modal-icon">{icon}</div>
          <div className="modal-title" style={{ color }}>{title}</div>
          <div className="modal-msg">{msg}</div>
          <div className="flex-center">
            <button className="btn btn-gold" onClick={onClose}>Continue Thy Quest</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: REGISTRATION ───────────────────────────────────────────────────────
function RegistrationPage({ onStart }) {
  const [teamName, setTeamName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");

  function addMember() {
    const m = memberInput.trim();
    if (!m) return;
    if (members.includes(m)) { setError("This adventurer already joins the party!"); return; }
    setMembers([...members, m]);
    setMemberInput("");
    setError("");
  }

  function removeMember(m) { setMembers(members.filter(x => x !== m)); }

  function handleSubmit() {
    if (!teamName.trim()) { setError("Thy party must have a name, brave soul!"); return; }
    if (members.length === 0) { setError("At least one adventurer must join the quest!"); return; }
    setError("");

    const teams = getStorage(STORAGE_KEYS.TEAMS, []);
    const newTeam = {
      id: Date.now(),
      name: teamName.trim(),
      members,
      found: Array(TOTAL_LOCATIONS).fill(false),
      attempts: Array(TOTAL_LOCATIONS).fill(0),
      startTime: null,
      endTime: null,
    };
    teams.push(newTeam);
    setStorage(STORAGE_KEYS.TEAMS, teams);
    setStorage(STORAGE_KEYS.CURRENT_TEAM, newTeam);
    onStart(newTeam);
  }

  return (
    <div className="main-content scroll-reveal">
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🐉</div>
        <p style={{ fontFamily: "'Fondamento', cursive", color: "var(--gold)", fontSize: "1rem", lineHeight: 1.7, opacity: 0.9, maxWidth: "560px", margin: "0 auto" }}>
          Hark, brave adventurer! Thou standest at the threshold of a grand quest across the ancient realm of Salem. Register thy fellowship to begin the hunt!
        </p>
      </div>

      <div className="parchment">
        <div className="parchment-title">⚔ Register Thy Fellowship ⚔</div>

        <div className="field-group">
          <label className="field-label">Party Name</label>
          <input
            className="field-input"
            placeholder="e.g. The Knights of Salem..."
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
          />
        </div>

        <div className="field-group">
          <label className="field-label">Add Adventurers</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              className="field-input"
              placeholder="Adventurer's name..."
              value={memberInput}
              onChange={e => setMemberInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addMember()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-gold" onClick={addMember} style={{ whiteSpace: "nowrap" }}>
              + Add
            </button>
          </div>
          <div className="members-area" style={{ marginTop: "0.5rem" }}>
            {members.length === 0 && <span style={{ fontSize: "0.8rem", color: "rgba(61,43,0,0.4)", fontFamily: "'Fondamento', cursive" }}>No adventurers yet...</span>}
            {members.map(m => (
              <span key={m} className="member-tag">
                🗡 {m}
                <button className="tag-remove" onClick={() => removeMember(m)}>×</button>
              </span>
            ))}
          </div>
        </div>

        {error && <p style={{ color: "var(--blood)", fontFamily: "'Fondamento', cursive", fontSize: "0.9rem", marginBottom: "1rem" }}>⚠ {error}</p>}

        <div className="flex-center mt-2">
          <button className="btn btn-blood" onClick={handleSubmit} style={{ fontSize: "1rem", padding: "0.9rem 2.5rem" }}>
            Begin the Quest!
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: HUNT ───────────────────────────────────────────────────────────────
function HuntPage({ team: initialTeam }) {
  const [team, setTeam] = useState(initialTeam);
  const [currentLoc, setCurrentLoc] = useState(() => {
    const t = getStorage(STORAGE_KEYS.CURRENT_TEAM, initialTeam);
    return t.found ? t.found.findIndex(f => !f) : 0;
  });
  const [hintsShown, setHintsShown] = useState(1);
  const [modal, setModal] = useState(null);
  const [checking, setChecking] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const adminData = getStorage(STORAGE_KEYS.ADMIN_DATA, DEFAULT_ADMIN);
  const locs = adminData.locations;

  // Completed?
  const allDone = team.found && team.found.every(Boolean);

  useLeaflet(mapRef, (map) => {
    leafletMapRef.current = map;
    setMapReady(true);
  });

  // Draw markers on map
  useEffect(() => {
    if (!leafletMapRef.current || !window.L) return;
    const map = leafletMapRef.current;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    team.found.forEach((found, i) => {
      const loc = locs[i];
      if (!loc) return;
      const color = found ? "#2a8a2a" : i === currentLoc ? "#c8a84b" : "#555";
      const label = found ? "✓" : i === currentLoc ? "⚔" : String(i + 1);

      const icon = window.L.divIcon({
        className: "",
        html: `<div style="width:32px;height:32px;background:${color};border:2px solid ${found ? "#4acc4a" : i===currentLoc?"#f0c040":"#888"};border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Cinzel',serif;font-size:${found?"14px":"11px"};font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.5)${i===currentLoc?",0 0 12px rgba(200,168,75,0.6)":""}">${label}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = window.L.marker([loc.lat, loc.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${loc.name}</b><br/><small>Location ${i + 1}</small>`);
      markersRef.current.push(marker);
    });

    if (locs[currentLoc]) {
      map.setView([locs[currentLoc].lat, locs[currentLoc].lng], 16, { animate: true });
    }
  }, [mapReady, currentLoc, team.found]);

  function updateTeam(updates) {
    const updated = { ...team, ...updates };
    setTeam(updated);
    setStorage(STORAGE_KEYS.CURRENT_TEAM, updated);
    const teams = getStorage(STORAGE_KEYS.TEAMS, []);
    const idx = teams.findIndex(t => t.id === updated.id);
    if (idx >= 0) teams[idx] = updated;
    setStorage(STORAGE_KEYS.TEAMS, teams);
  }

  function checkLocation() {
    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setChecking(false);
        const { latitude, longitude } = pos.coords;
        const loc = locs[currentLoc];
        if (!loc) return;
        const dist = haversineDistance(latitude, longitude, loc.lat, loc.lng);
        const radius = loc.radius || 150;

        if (dist <= radius) {
          // Correct!
          const newFound = [...(team.found || Array(10).fill(false))];
          newFound[currentLoc] = true;

          const isFirst = !newFound.slice(0, currentLoc).some(Boolean) && currentLoc === 0;
          const isLast = newFound.every(Boolean);

          const updates = { found: newFound };
          if (!team.startTime) updates.startTime = nowStamp();
          if (isLast) updates.endTime = nowStamp();

          updateTeam(updates);

          const next = newFound.findIndex(f => !f);
          setModal({
            icon: "🏆",
            title: "Location Found!",
            msg: isLast
              ? `GLORY BE! Thou hast completed the entire Quest! Thy fellowship shall be remembered in legend!`
              : `Well done, brave ${team.name}! Thou hast found ${loc.name}. Thy quest continues...`,
            color: "#f0c040",
            onClose: () => {
              setModal(null);
              if (next >= 0) { setCurrentLoc(next); setHintsShown(1); }
            },
          });
        } else {
          setModal({
            icon: "💀",
            title: "Wrong Location!",
            msg: `Alas! Thou art ${Math.round(dist)} meters from thy true destination. The shadows mock thee — try again!`,
            color: "var(--blood)",
            onClose: () => setModal(null),
          });
        }
      },
      (err) => {
        setChecking(false);
        setModal({
          icon: "🌑",
          title: "Location Unknown",
          msg: "The mystical forces cannot determine thy position. Please enable location services and try again.",
          color: "var(--silver)",
          onClose: () => setModal(null),
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const loc = locs[currentLoc];
  const hints = loc?.hints || [];

  return (
    <div className="main-content scroll-reveal">
      {modal && <Modal {...modal} />}

      <div className="dark-card mb-1" style={{ marginBottom: "1rem" }}>
        <div className="dark-card-title">⚔ {team.name}'s Quest ⚔</div>
        <div style={{ textAlign: "center", fontFamily: "'Fondamento', cursive", fontSize: "0.85rem", color: "var(--silver)", marginBottom: "0.75rem" }}>
          {team.members.join(" · ")}
        </div>
        <div className="progress-row">
          {Array.from({ length: TOTAL_LOCATIONS }, (_, i) => {
            const done = team.found?.[i];
            const cur = i === currentLoc && !done;
            return (
              <div key={i} className={`progress-dot ${done ? "dot-complete" : cur ? "dot-current" : "dot-pending"}`}>
                {done ? "✓" : i + 1}
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--silver)", fontFamily: "'Fondamento', cursive" }}>
          {team.found?.filter(Boolean).length || 0} of {TOTAL_LOCATIONS} locations found
        </div>
      </div>

      <div id="quest-map" ref={mapRef} style={{ marginBottom: "1rem" }} />

      {allDone ? (
        <div className="parchment text-center">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏆</div>
          <div className="parchment-title">Quest Complete!</div>
          <p style={{ fontFamily: "'Fondamento', cursive", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Hail, glorious {team.name}! Thou hast conquered all {TOTAL_LOCATIONS} locations and proven thy worth across the realm of Salem. Thy names shall be etched in legend!
          </p>
          {team.startTime && <p className="small-text">Journey began: {team.startTime}</p>}
          {team.endTime && <p className="small-text">Quest completed: {team.endTime}</p>}
          <div className="flex-center mt-2">
            <button className="btn btn-gold" onClick={() => exportCSV(getStorage(STORAGE_KEYS.TEAMS, []))}>
              📜 Download Scroll of Results
            </button>
          </div>
        </div>
      ) : loc ? (
        <div className="parchment">
          <div className="parchment-title">📜 Location {currentLoc + 1}: The Riddle</div>

          {hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className="hint-box">
              <span style={{ fontWeight: "bold", fontSize: "0.75rem", letterSpacing: "0.05em" }}>HINT {i + 1}: </span>
              {h}
            </div>
          ))}

          {hintsShown < hints.length && (
            <div className="flex-center mt-1">
              <button className="btn btn-forest btn-sm" onClick={() => setHintsShown(h => h + 1)}>
                🕯 Reveal Another Hint ({hintsShown}/{hints.length})
              </button>
            </div>
          )}

          <hr className="divider" />

          <div className="text-center">
            <p style={{ fontFamily: "'Fondamento', cursive", fontSize: "0.85rem", color: "var(--ink-mid)", marginBottom: "1rem" }}>
              Hast thou arrived at the sacred location? Press below to verify thy position!
            </p>
            <button className="btn btn-blood" onClick={checkLocation} disabled={checking} style={{ fontSize: "1rem", padding: "0.9rem 2rem" }}>
              {checking ? "⏳ Consulting the Oracle..." : "⚔ I Am Here! Verify Location"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── PAGE: ADMIN ──────────────────────────────────────────────────────────────
function AdminPage({ onBack }) {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(() => getStorage(STORAGE_KEYS.ADMIN_DATA, DEFAULT_ADMIN));
  const [cryptic, setCryptic] = useState(() => getStorage(STORAGE_KEYS.CRYPTIC, DEFAULT_CRYPTIC));
  const [saved, setSaved] = useState(false);
  const [teams] = useState(() => getStorage(STORAGE_KEYS.TEAMS, []));

  function saveData() {
    setStorage(STORAGE_KEYS.ADMIN_DATA, data);
    setStorage(STORAGE_KEYS.CRYPTIC, cryptic);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateLoc(i, field, val) {
    const locs = [...data.locations];
    locs[i] = { ...locs[i], [field]: val };
    setData({ ...data, locations: locs });
  }

  function updateHint(locIdx, hintIdx, val) {
    const locs = [...data.locations];
    const hints = [...(locs[locIdx].hints || ["","",""])];
    hints[hintIdx] = val;
    locs[locIdx] = { ...locs[locIdx], hints };
    setData({ ...data, locations: locs });
  }

  return (
    <div className="main-content scroll-reveal">
      <div className="dark-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div className="dark-card-title" style={{ margin: 0 }}>⚙ Dungeon Master's Sanctum</div>
          <button className="btn btn-sm" onClick={onBack}
            style={{ background: "transparent", border: "1px solid rgba(200,168,75,0.3)", color: "var(--gold)", fontFamily: "'Cinzel',serif", cursor: "pointer", fontSize: "0.7rem", padding: "0.3rem 0.7rem" }}>
            ← Return
          </button>
        </div>

        <div className="admin-nav">
          {["Locations & Hints", "Cryptic Message", "Team Records"].map((t, i) => (
            <button key={i} className={`admin-tab ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>

        {tab === 0 && (
          <div>
            {data.locations.map((loc, i) => (
              <div key={i} className="loc-card">
                <div className="loc-num">📍 LOCATION {i + 1}</div>
                <div className="grid-2">
                  <div className="field-group">
                    <label className="field-label dark-label">Location Name</label>
                    <input className="field-input dark-input" value={loc.name || ""} onChange={e => updateLoc(i, "name", e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label dark-label">Detection Radius (meters)</label>
                    <input type="number" className="field-input dark-input" value={loc.radius || 150} onChange={e => updateLoc(i, "radius", Number(e.target.value))} />
                  </div>
                  <div className="field-group">
                    <label className="field-label dark-label">Latitude</label>
                    <input type="number" step="0.0001" className="field-input dark-input" value={loc.lat || ""} onChange={e => updateLoc(i, "lat", parseFloat(e.target.value))} />
                  </div>
                  <div className="field-group">
                    <label className="field-label dark-label">Longitude</label>
                    <input type="number" step="0.0001" className="field-input dark-input" value={loc.lng || ""} onChange={e => updateLoc(i, "lng", parseFloat(e.target.value))} />
                  </div>
                </div>
                {[0, 1, 2].map(hi => (
                  <div key={hi} className="field-group">
                    <label className="field-label dark-label">Hint {hi + 1}</label>
                    <textarea className="field-input dark-input" value={loc.hints?.[hi] || ""} onChange={e => updateHint(i, hi, e.target.value)} rows={2} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === 1 && (
          <div>
            <p style={{ fontFamily: "'Fondamento', cursive", color: "var(--silver)", fontSize: "0.85rem", marginBottom: "1rem", lineHeight: 1.6 }}>
              This secret message appears only to those who discover the hidden link in the footer. Craft it wisely, Dungeon Master.
            </p>
            <div className="field-group">
              <label className="field-label dark-label">Cryptic Message</label>
              <textarea className="field-input dark-input" value={cryptic} onChange={e => setCryptic(e.target.value)} rows={6} />
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            {teams.length === 0 ? (
              <p style={{ color: "var(--silver)", fontFamily: "'Fondamento', cursive", textAlign: "center" }}>No teams have registered yet.</p>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", fontFamily: "'Cinzel', serif" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(200,168,75,0.3)" }}>
                        {["Team", "Members", "Start", "End", ...Array.from({length:10},(_,i)=>`L${i+1}`)].map(h => (
                          <th key={h} style={{ padding: "0.4rem 0.6rem", color: "var(--gold)", textAlign: "left", whiteSpace: "nowrap", fontSize: "0.7rem" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map(t => (
                        <tr key={t.id} style={{ borderBottom: "1px solid rgba(200,168,75,0.1)" }}>
                          <td style={{ padding: "0.4rem 0.6rem", color: "var(--parchment)" }}>{t.name}</td>
                          <td style={{ padding: "0.4rem 0.6rem", color: "var(--silver)", fontSize: "0.7rem" }}>{t.members?.join(", ")}</td>
                          <td style={{ padding: "0.4rem 0.6rem", color: "var(--silver)", whiteSpace: "nowrap" }}>{t.startTime || "–"}</td>
                          <td style={{ padding: "0.4rem 0.6rem", color: "var(--silver)", whiteSpace: "nowrap" }}>{t.endTime || "–"}</td>
                          {Array.from({length:10},(_,i) => (
                            <td key={i} style={{ padding: "0.4rem 0.6rem", textAlign: "center", color: t.found?.[i] ? "#4acc4a" : "rgba(255,255,255,0.2)" }}>
                              {t.found?.[i] ? "✓" : "·"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex-center mt-2">
                  <button className="btn btn-gold" onClick={() => exportCSV(teams)}>
                    📜 Export to CSV
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <hr className="divider" />
        <div className="flex-center gap-1" style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <button className="btn btn-gold" onClick={saveData}>
            {saved ? "✓ Saved!" : "💾 Save All Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: CRYPTIC ────────────────────────────────────────────────────────────
function CrypticPage({ onBack }) {
  const msg = getStorage(STORAGE_KEYS.CRYPTIC, DEFAULT_CRYPTIC);
  return (
    <div className="main-content">
      <div className="cryptic-container">
        <div className="cryptic-glyph">🔮</div>
        <div className="dark-card" style={{ maxWidth: "600px", background: "rgba(5,3,10,0.95)", border: "1px solid rgba(139,0,139,0.4)" }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "rgba(200,0,200,0.6)", fontFamily: "'Cinzel', serif", textAlign: "center", marginBottom: "1.5rem", textTransform: "uppercase" }}>
            ✦ Hidden Scroll — Eyes Only ✦
          </div>
          <div className="cryptic-text" style={{ margin: "0 auto" }}>{msg}</div>
          <div className="flex-center" style={{ marginTop: "2rem" }}>
            <button className="btn" style={{ background: "rgba(80,0,80,0.5)", border: "1px solid rgba(139,0,139,0.4)", color: "rgba(220,150,220,0.8)", fontFamily: "'Cinzel',serif", fontSize: "0.75rem", cursor: "pointer", padding: "0.5rem 1.2rem" }} onClick={onBack}>
              ← Vanish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("register");
  const [team, setTeam] = useState(() => getStorage(STORAGE_KEYS.CURRENT_TEAM, null));

  // Inject styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = globalStyles;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Resume quest if team exists
  useEffect(() => {
    if (team && !team.found?.every(Boolean)) setPage("hunt");
  }, []);

  function handleStart(newTeam) {
    setTeam(newTeam);
    setPage("hunt");
  }

  return (
    <div className="app-shell">
      <div className="content-wrap">
        <Header onAdmin={() => setPage("admin")} />

        {page === "register" && <RegistrationPage onStart={handleStart} />}
        {page === "hunt" && team && <HuntPage team={team} />}
        {page === "admin" && <AdminPage onBack={() => setPage(team ? "hunt" : "register")} />}
        {page === "cryptic" && <CrypticPage onBack={() => setPage(team ? "hunt" : "register")} />}

        <Footer onSecret={e => { e.preventDefault(); setPage("cryptic"); }} />
      </div>
    </div>
  );
}
