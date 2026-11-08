const fs = require('fs');
const path = require('path');

const outDir = 'c:/all project/eco/web/public/previews';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// ── LAYOUT 1: Omnichannel 3-Column Split Workspace ─────────────────────────────
const svg1 = `<svg width="1200" height="750" viewBox="0 0 1200 750" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">
  <defs>
    <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="750" fill="url(#bg1)"/>

  <!-- Top Navigation Header -->
  <rect x="0" y="0" width="1200" height="64" fill="#0f172a" stroke="#334155" stroke-width="1"/>
  <circle cx="36" cy="32" r="14" fill="url(#brand)"/>
  <text x="62" y="38" fill="#ffffff" font-size="16" font-weight="800">EMA STORE</text>
  <rect x="175" y="20" width="1" height="24" fill="#334155"/>
  <text x="195" y="38" fill="#38bdf8" font-size="14" font-weight="600">Layout 1: 3-Column Omnichannel Workspace</text>

  <!-- KPI Badges Header -->
  <g transform="translate(680, 16)">
    <rect x="0" y="0" width="110" height="32" rx="8" fill="#1e293b" stroke="#334155"/>
    <text x="12" y="21" fill="#94a3b8" font-size="11">Open: <tspan fill="#f59e0b" font-weight="700">14</tspan></text>
    <rect x="120" y="0" width="110" height="32" rx="8" fill="#1e293b" stroke="#334155"/>
    <text x="132" y="21" fill="#94a3b8" font-size="11">In Progress: <tspan fill="#38bdf8" font-weight="700">8</tspan></text>
    <rect x="240" y="0" width="110" height="32" rx="8" fill="#1e293b" stroke="#334155"/>
    <text x="252" y="21" fill="#94a3b8" font-size="11">Resolved: <tspan fill="#10b981" font-weight="700">142</tspan></text>
    <rect x="360" y="0" width="130" height="32" rx="8" fill="#047857"/>
    <text x="376" y="21" fill="#ffffff" font-size="12" font-weight="600">⚡ Auto-Greeting ON</text>
  </g>

  <!-- COLUMN 1: TICKET QUEUE (Left 320px) -->
  <g transform="translate(20, 80)">
    <rect width="320" height="645" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    
    <text x="20" y="32" fill="#ffffff" font-size="16" font-weight="700">Live Queue</text>
    <rect x="230" y="14" width="70" height="26" rx="6" fill="#0f172a" stroke="#334155"/>
    <text x="242" y="31" fill="#94a3b8" font-size="11" font-weight="600">⚙ Settings</text>
    
    <rect x="20" y="52" width="280" height="36" rx="8" fill="#0f172a" stroke="#334155"/>
    <text x="36" y="74" fill="#64748b" font-size="12">🔍 Search customer, phone, ID...</text>

    <!-- Filter pills -->
    <rect x="20" y="100" width="55" height="24" rx="6" fill="#059669"/>
    <text x="32" y="116" fill="#ffffff" font-size="11" font-weight="700">All (22)</text>
    <rect x="82" y="100" width="60" height="24" rx="6" fill="#334155"/>
    <text x="94" y="116" fill="#94a3b8" font-size="11">Open (14)</text>
    <rect x="149" y="100" width="80" height="24" rx="6" fill="#334155"/>
    <text x="160" y="116" fill="#94a3b8" font-size="11">In Progress</text>
    <rect x="236" y="100" width="64" height="24" rx="6" fill="#334155"/>
    <text x="248" y="116" fill="#94a3b8" font-size="11">Resolved</text>

    <!-- Card 1 (Active) -->
    <g transform="translate(15, 138)">
      <rect width="290" height="105" rx="12" fill="#0f172a" stroke="#059669" stroke-width="2"/>
      <text x="14" y="24" fill="#ffffff" font-size="13" font-weight="700">Payment deduction on Telebirr</text>
      <text x="14" y="44" fill="#94a3b8" font-size="11">Abebe Kebede · +251 91 122 3344</text>
      <rect x="14" y="56" width="55" height="18" rx="4" fill="#f59e0b" fill-opacity="0.2"/>
      <text x="20" y="69" fill="#fbbf24" font-size="10" font-weight="700">URGENT</text>
      <rect x="76" y="56" width="48" height="18" rx="4" fill="#3b82f6" fill-opacity="0.2"/>
      <text x="82" y="69" fill="#60a5fa" font-size="10" font-weight="700">OPEN</text>
      <text x="225" y="69" fill="#64748b" font-size="10">2m ago</text>
      <text x="14" y="92" fill="#cbd5e1" font-size="11" opacity="0.8">"My balance was cut but no order..."</text>
    </g>

    <!-- Card 2 -->
    <g transform="translate(15, 253)">
      <rect width="290" height="95" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1"/>
      <text x="14" y="24" fill="#ffffff" font-size="13" font-weight="600">Where is my luxury shoe order?</text>
      <text x="14" y="44" fill="#94a3b8" font-size="11">Sara Tesfaye · +251 92 445 5667</text>
      <rect x="14" y="56" width="50" height="18" rx="4" fill="#334155"/>
      <text x="20" y="69" fill="#94a3b8" font-size="10" font-weight="600">MEDIUM</text>
      <rect x="70" y="56" width="75" height="18" rx="4" fill="#059669" fill-opacity="0.2"/>
      <text x="76" y="69" fill="#34d399" font-size="10" font-weight="700">IN PROGRESS</text>
      <text x="230" y="69" fill="#64748b" font-size="10">14m ago</text>
    </g>
  </g>

  <!-- COLUMN 2: ACTIVE CONVERSATION (Center 520px) -->
  <g transform="translate(360, 80)">
    <rect width="520" height="645" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    
    <!-- Chat Header -->
    <rect x="0" y="0" width="520" height="68" rx="16" fill="#0f172a" stroke="#334155" stroke-width="1"/>
    <circle cx="34" cy="34" r="18" fill="#059669"/>
    <text x="26" y="39" fill="#ffffff" font-size="12" font-weight="800">AK</text>
    <text x="64" y="28" fill="#ffffff" font-size="14" font-weight="700">Payment deduction on Telebirr</text>
    <text x="64" y="48" fill="#94a3b8" font-size="11">Abebe Kebede · Ticket #TCK-88219</text>
    
    <rect x="330" y="18" width="105" height="32" rx="8" fill="#1e293b" stroke="#f59e0b"/>
    <text x="342" y="38" fill="#fbbf24" font-size="11" font-weight="700">● IN PROGRESS</text>
    <rect x="445" y="18" width="60" height="32" rx="8" fill="#059669"/>
    <text x="455" y="38" fill="#ffffff" font-size="11" font-weight="700">Resolve</text>

    <!-- Message Bubbles -->
    <!-- Customer Message -->
    <g transform="translate(20, 95)">
      <rect width="360" height="62" rx="12" fill="#0f172a" stroke="#334155"/>
      <text x="14" y="22" fill="#38bdf8" font-size="10" font-weight="700">Abebe Kebede (Customer) · 10:41 AM</text>
      <text x="14" y="42" fill="#e2e8f0" font-size="12">I paid 2,400 ETB via Telebirr but order still says pending.</text>
    </g>

    <!-- System Auto-Greeting -->
    <g transform="translate(60, 175)">
      <rect width="390" height="54" rx="12" fill="#047857" fill-opacity="0.25" stroke="#059669" stroke-dasharray="4,4"/>
      <text x="14" y="20" fill="#34d399" font-size="10" font-weight="700">🤖 Automated Welcome · 10:41 AM</text>
      <text x="14" y="38" fill="#e2e8f0" font-size="11">Welcome! A support admin is reviewing your account details.</text>
    </g>

    <!-- Agent Reply -->
    <g transform="translate(140, 248)">
      <rect width="360" height="74" rx="12" fill="#059669"/>
      <text x="14" y="22" fill="#ffffff" font-size="10" font-weight="700">Kaleab (Support Admin) · 10:43 AM · ✓✓</text>
      <text x="14" y="42" fill="#ffffff" font-size="12">Hello Abebe! Checking transaction ref now with our</text>
      <text x="14" y="60" fill="#ffffff" font-size="12">Telebirr gateway. One moment please.</text>
    </g>

    <!-- Canned Quick Responses Bar -->
    <g transform="translate(20, 505)">
      <rect width="480" height="38" rx="8" fill="#0f172a" stroke="#334155"/>
      <text x="12" y="24" fill="#64748b" font-size="10" font-weight="700">TEMPLATES:</text>
      <rect x="95" y="7" width="115" height="24" rx="6" fill="#334155"/>
      <text x="105" y="23" fill="#cbd5e1" font-size="10">⚡ Check Telebirr</text>
      <rect x="220" y="7" width="115" height="24" rx="6" fill="#334155"/>
      <text x="230" y="23" fill="#cbd5e1" font-size="10">⚡ Order Tracking</text>
      <rect x="345" y="7" width="105" height="24" rx="6" fill="#334155"/>
      <text x="355" y="23" fill="#cbd5e1" font-size="10">⚡ Ask Account ID</text>
    </g>

    <!-- Reply Input Bar -->
    <g transform="translate(20, 555)">
      <rect width="480" height="70" rx="12" fill="#0f172a" stroke="#334155"/>
      <text x="16" y="30" fill="#64748b" font-size="12">Type reply as Support Admin (Enter to send)...</text>
      <rect x="410" y="16" width="55" height="36" rx="8" fill="#059669"/>
      <text x="424" y="39" fill="#ffffff" font-size="12" font-weight="700">Send</text>
    </g>
  </g>

  <!-- COLUMN 3: LIVE CUSTOMER INTELLIGENCE (Right 280px) -->
  <g transform="translate(900, 80)">
    <rect width="280" height="645" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    
    <text x="20" y="32" fill="#ffffff" font-size="15" font-weight="700">Customer Profile</text>
    <rect x="195" y="16" width="65" height="22" rx="11" fill="#10b981" fill-opacity="0.2"/>
    <text x="206" y="31" fill="#34d399" font-size="10" font-weight="700">ACTIVE</text>

    <!-- Avatar & Bio -->
    <circle cx="140" cy="85" r="28" fill="#059669"/>
    <text x="126" y="93" fill="#ffffff" font-size="18" font-weight="800">AK</text>
    <text x="140" y="130" fill="#ffffff" font-size="14" font-weight="700" text-anchor="middle">Abebe Kebede</text>
    <text x="140" y="148" fill="#94a3b8" font-size="11" text-anchor="middle">+251 91 122 3344</text>

    <!-- Stats Grid -->
    <g transform="translate(20, 180)">
      <rect width="115" height="60" rx="8" fill="#0f172a" stroke="#334155"/>
      <text x="12" y="22" fill="#94a3b8" font-size="10">Wallet Balance</text>
      <text x="12" y="46" fill="#10b981" font-size="13" font-weight="800">3,450 ETB</text>

      <rect x="125" y="0" width="115" height="60" rx="8" fill="#0f172a" stroke="#334155"/>
      <text x="137" y="22" fill="#94a3b8" font-size="10">Ema Coins</text>
      <text x="137" y="46" fill="#fbbf24" font-size="13" font-weight="800">120 🪙</text>

      <rect x="0" y="70" width="115" height="60" rx="8" fill="#0f172a" stroke="#334155"/>
      <text x="12" y="92" fill="#94a3b8" font-size="10">Total Orders</text>
      <text x="12" y="116" fill="#ffffff" font-size="13" font-weight="800">14 Orders</text>

      <rect x="125" y="70" width="115" height="60" rx="8" fill="#0f172a" stroke="#334155"/>
      <text x="137" y="92" fill="#94a3b8" font-size="10">Total Spent</text>
      <text x="137" y="116" fill="#38bdf8" font-size="13" font-weight="800">28,900 ETB</text>
    </g>

    <!-- Recent Order Box -->
    <g transform="translate(20, 335)">
      <text x="0" y="0" fill="#ffffff" font-size="12" font-weight="700">Attached Order #ORD-9912</text>
      <rect y="10" width="240" height="65" rx="8" fill="#0f172a" stroke="#334155"/>
      <text x="12" y="30" fill="#ffffff" font-size="11" font-weight="600">Samsung Galaxy S24 Ultra</text>
      <text x="12" y="48" fill="#94a3b8" font-size="10">Status: <tspan fill="#fbbf24">PENDING PAYMENT</tspan></text>
      <text x="12" y="64" fill="#10b981" font-size="11" font-weight="700">2,400.00 ETB</text>
    </g>

    <!-- Account Actions -->
    <g transform="translate(20, 435)">
      <rect width="240" height="36" rx="8" fill="#334155"/>
      <text x="65" y="23" fill="#ffffff" font-size="11" font-weight="600">📞 Call Customer</text>

      <rect y="48" width="240" height="36" rx="8" fill="#ef4444" fill-opacity="0.15" stroke="#ef4444"/>
      <text x="68" y="71" fill="#f87171" font-size="11" font-weight="700">🚫 Block Customer</text>

      <rect y="96" width="240" height="36" rx="8" fill="#0f172a" stroke="#334155"/>
      <text x="50" y="119" fill="#94a3b8" font-size="11">📋 View All 14 Orders</text>
    </g>
  </g>
</svg>`;

// ── LAYOUT 2: Kanban Priority & Workflow Board ─────────────────────────────────
const svg2 = `<svg width="1200" height="750" viewBox="0 0 1200 750" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b132b"/>
      <stop offset="100%" stop-color="#1c2541"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="750" fill="url(#bg2)"/>

  <!-- Top bar -->
  <rect x="0" y="0" width="1200" height="64" fill="#0b132b" stroke="#334155" stroke-width="1"/>
  <circle cx="36" cy="32" r="14" fill="#3b82f6"/>
  <text x="62" y="38" fill="#ffffff" font-size="16" font-weight="800">EMA STORE</text>
  <rect x="175" y="20" width="1" height="24" fill="#334155"/>
  <text x="195" y="38" fill="#60a5fa" font-size="14" font-weight="600">Layout 2: Kanban Pipeline View (Drag &amp; Drop Status)</text>

  <!-- Filter & Actions Bar -->
  <g transform="translate(40, 80)">
    <rect width="1120" height="50" rx="10" fill="#1c2541" stroke="#334155"/>
    <text x="20" y="31" fill="#94a3b8" font-size="13">Filter: All Priorities</text>
    <rect x="160" y="10" width="180" height="30" rx="6" fill="#0b132b" stroke="#334155"/>
    <text x="175" y="30" fill="#64748b" font-size="11">🔍 Quick filter tickets...</text>
    <rect x="980" y="10" width="120" height="30" rx="6" fill="#2563eb"/>
    <text x="1002" y="30" fill="#ffffff" font-size="12" font-weight="600">+ New Ticket</text>
  </g>

  <!-- 4 KANBAN LANES -->
  <!-- Lane 1: OPEN (New) -->
  <g transform="translate(40, 150)">
    <rect width="260" height="570" rx="12" fill="#1c2541" stroke="#334155"/>
    <rect x="12" y="12" width="10" height="10" rx="5" fill="#ef4444"/>
    <text x="30" y="22" fill="#ffffff" font-size="13" font-weight="700">OPEN TICKETS</text>
    <rect x="215" y="8" width="32" height="20" rx="10" fill="#334155"/>
    <text x="227" y="22" fill="#f87171" font-size="11" font-weight="700">5</text>

    <!-- Card A -->
    <g transform="translate(12, 45)">
      <rect width="236" height="120" rx="8" fill="#0b132b" stroke="#ef4444" stroke-width="1.5"/>
      <text x="10" y="22" fill="#f87171" font-size="10" font-weight="700">URGENT · 2m ago</text>
      <text x="10" y="42" fill="#ffffff" font-size="12" font-weight="700">Double charged on Telebirr</text>
      <text x="10" y="60" fill="#94a3b8" font-size="11">Kassahun B. (+251911...)</text>
      <rect x="10" y="75" width="216" height="30" rx="4" fill="#1e293b"/>
      <text x="60" y="95" fill="#38bdf8" font-size="11">💬 Open quick chat</text>
    </g>

    <!-- Card B -->
    <g transform="translate(12, 180)">
      <rect width="236" height="105" rx="8" fill="#0b132b" stroke="#334155"/>
      <text x="10" y="22" fill="#fbbf24" font-size="10" font-weight="700">MEDIUM · 18m ago</text>
      <text x="10" y="42" fill="#ffffff" font-size="12" font-weight="700">Address change request</text>
      <text x="10" y="60" fill="#94a3b8" font-size="11">Hanan M. (+251922...)</text>
    </g>
  </g>

  <!-- Lane 2: IN PROGRESS -->
  <g transform="translate(325, 150)">
    <rect width="260" height="570" rx="12" fill="#1c2541" stroke="#334155"/>
    <rect x="12" y="12" width="10" height="10" rx="5" fill="#3b82f6"/>
    <text x="30" y="22" fill="#ffffff" font-size="13" font-weight="700">IN PROGRESS</text>
    <rect x="215" y="8" width="32" height="20" rx="10" fill="#334155"/>
    <text x="227" y="22" fill="#60a5fa" font-size="11" font-weight="700">8</text>

    <!-- Card C -->
    <g transform="translate(12, 45)">
      <rect width="236" height="130" rx="8" fill="#0b132b" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="10" y="22" fill="#60a5fa" font-size="10" font-weight="700">ASSIGNED TO: KALEAB</text>
      <text x="10" y="42" fill="#ffffff" font-size="12" font-weight="700">Shoe size replacement</text>
      <text x="10" y="60" fill="#94a3b8" font-size="11">Bethlehem T. (+251933...)</text>
      <text x="10" y="78" fill="#64748b" font-size="10">Last reply: 4m ago by Staff</text>
      <rect x="10" y="90" width="216" height="28" rx="4" fill="#2563eb"/>
      <text x="75" y="108" fill="#ffffff" font-size="11" font-weight="600">View Thread</text>
    </g>
  </g>

  <!-- Lane 3: AWAITING USER -->
  <g transform="translate(610, 150)">
    <rect width="260" height="570" rx="12" fill="#1c2541" stroke="#334155"/>
    <rect x="12" y="12" width="10" height="10" rx="5" fill="#f59e0b"/>
    <text x="30" y="22" fill="#ffffff" font-size="13" font-weight="700">AWAITING USER</text>
    <rect x="215" y="8" width="32" height="20" rx="10" fill="#334155"/>
    <text x="227" y="22" fill="#fbbf24" font-size="11" font-weight="700">4</text>

    <g transform="translate(12, 45)">
      <rect width="236" height="110" rx="8" fill="#0b132b" stroke="#334155"/>
      <text x="10" y="22" fill="#fbbf24" font-size="10" font-weight="700">SENT PHOTO UPLOAD LINK</text>
      <text x="10" y="42" fill="#ffffff" font-size="12" font-weight="700">Damaged package photo</text>
      <text x="10" y="60" fill="#94a3b8" font-size="11">Natnael G. (+251944...)</text>
    </g>
  </g>

  <!-- Lane 4: RESOLVED -->
  <g transform="translate(895, 150)">
    <rect width="260" height="570" rx="12" fill="#1c2541" stroke="#334155"/>
    <rect x="12" y="12" width="10" height="10" rx="5" fill="#10b981"/>
    <text x="30" y="22" fill="#ffffff" font-size="13" font-weight="700">RESOLVED TODAY</text>
    <rect x="215" y="8" width="32" height="20" rx="10" fill="#334155"/>
    <text x="223" y="22" fill="#34d399" font-size="11" font-weight="700">24</text>

    <g transform="translate(12, 45)">
      <rect width="236" height="90" rx="8" fill="#0b132b" stroke="#10b981" stroke-width="1"/>
      <text x="10" y="22" fill="#34d399" font-size="10" font-weight="700">RESOLVED ✓</text>
      <text x="10" y="42" fill="#ffffff" font-size="12" font-weight="700">Refund issued #REF-3312</text>
      <text x="10" y="60" fill="#94a3b8" font-size="11">Yared K. (+251955...)</text>
    </g>
  </g>
</svg>`;

// ── LAYOUT 3: Focused High-Speed Live Studio ──────────────────────────────────
const svg3 = `<svg width="1200" height="750" viewBox="0 0 1200 750" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">
  <defs>
    <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
    <linearGradient id="emeraldG" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="750" fill="url(#bg3)"/>

  <!-- Top bar -->
  <rect x="0" y="0" width="1200" height="56" fill="#18181b" stroke="#27272a" stroke-width="1"/>
  <circle cx="32" cy="28" r="12" fill="url(#emeraldG)"/>
  <text x="54" y="33" fill="#ffffff" font-size="15" font-weight="800">EMA LIVE STUDIO</text>
  <rect x="195" y="16" width="1" height="24" fill="#27272a"/>
  <text x="210" y="32" fill="#a1a1aa" font-size="13">Layout 3: Full-Screen Live Support Studio (WhatsApp/Intercom Style)</text>

  <!-- Left: Compact Inbox List (360px) -->
  <g transform="translate(16, 72)">
    <rect width="360" height="660" rx="12" fill="#18181b" stroke="#27272a"/>
    <text x="20" y="32" fill="#ffffff" font-size="16" font-weight="800">Conversations</text>
    <rect x="20" y="48" width="320" height="36" rx="8" fill="#27272a"/>
    <text x="36" y="70" fill="#71717a" font-size="12">🔍 Search chats, order numbers...</text>

    <!-- Chats -->
    <g transform="translate(12, 100)">
      <rect width="336" height="72" rx="10" fill="#27272a"/>
      <circle cx="30" cy="36" r="18" fill="#059669"/>
      <text x="22" y="40" fill="#ffffff" font-size="11" font-weight="800">AK</text>
      <text x="58" y="28" fill="#ffffff" font-size="13" font-weight="700">Abebe Kebede</text>
      <text x="270" y="28" fill="#10b981" font-size="10" font-weight="700">10:43 AM</text>
      <text x="58" y="48" fill="#a1a1aa" font-size="11">Checking transaction ref now...</text>
      <circle cx="318" cy="46" r="8" fill="#ef4444"/>
      <text x="315" y="50" fill="#ffffff" font-size="10" font-weight="800">1</text>
    </g>

    <g transform="translate(12, 180)">
      <rect width="336" height="72" rx="10" fill="#18181b"/>
      <circle cx="30" cy="36" r="18" fill="#3f3f46"/>
      <text x="22" y="40" fill="#ffffff" font-size="11" font-weight="800">ST</text>
      <text x="58" y="28" fill="#e4e4e7" font-size="13" font-weight="600">Sara Tesfaye</text>
      <text x="270" y="28" fill="#71717a" font-size="10">10:20 AM</text>
      <text x="58" y="48" fill="#71717a" font-size="11">Is express shipping available in Hawassa?</text>
    </g>

    <g transform="translate(12, 260)">
      <rect width="336" height="72" rx="10" fill="#18181b"/>
      <circle cx="30" cy="36" r="18" fill="#3f3f46"/>
      <text x="22" y="40" fill="#ffffff" font-size="11" font-weight="800">DA</text>
      <text x="58" y="28" fill="#e4e4e7" font-size="13" font-weight="600">Dawit Alem</text>
      <text x="270" y="28" fill="#71717a" font-size="10">9:55 AM</text>
      <text x="58" y="48" fill="#71717a" font-size="11">Thank you, the replacement arrived!</text>
    </g>
  </g>

  <!-- Right: Wide Focused Chat Screen (800px) -->
  <g transform="translate(390, 72)">
    <rect width="794" height="660" rx="12" fill="#18181b" stroke="#27272a"/>
    
    <!-- Big Chat Bar -->
    <rect x="0" y="0" width="794" height="64" rx="12" fill="#27272a"/>
    <circle cx="36" cy="32" r="18" fill="#059669"/>
    <text x="28" y="36" fill="#ffffff" font-size="12" font-weight="800">AK</text>
    <text x="66" y="26" fill="#ffffff" font-size="14" font-weight="700">Abebe Kebede</text>
    <text x="66" y="44" fill="#a1a1aa" font-size="11">+251 91 122 3344 · Active on Customer App</text>
    
    <rect x="470" y="16" width="190" height="32" rx="6" fill="#18181b" stroke="#059669"/>
    <text x="480" y="36" fill="#34d399" font-size="11" font-weight="700">📦 Order #ORD-9912 (2,400 ETB)</text>
    
    <rect x="670" y="16" width="105" height="32" rx="6" fill="#10b981"/>
    <text x="688" y="36" fill="#ffffff" font-size="12" font-weight="700">✓ Mark Done</text>

    <!-- Chat Messages -->
    <g transform="translate(30, 95)">
      <rect width="460" height="65" rx="14" fill="#27272a"/>
      <text x="16" y="24" fill="#a1a1aa" font-size="11" font-weight="600">Abebe Kebede · 10:41 AM</text>
      <text x="16" y="46" fill="#ffffff" font-size="13">I paid 2,400 ETB via Telebirr but order still says pending.</text>
    </g>

    <g transform="translate(290, 185)">
      <rect width="470" height="80" rx="14" fill="#059669"/>
      <text x="16" y="24" fill="#d1fae5" font-size="11" font-weight="700">Support Admin (Kaleab) · 10:43 AM</text>
      <text x="16" y="46" fill="#ffffff" font-size="13">Hello Abebe! Checking transaction ref now with our</text>
      <text x="16" y="64" fill="#ffffff" font-size="13">Telebirr gateway. One moment please.</text>
    </g>

    <!-- Attached Order Card inside Chat stream -->
    <g transform="translate(290, 280)">
      <rect width="470" height="100" rx="12" fill="#18181b" stroke="#059669" stroke-width="1.5"/>
      <text x="16" y="24" fill="#34d399" font-size="11" font-weight="800">ATTACHED ORDER SUMMARY</text>
      <text x="16" y="46" fill="#ffffff" font-size="13" font-weight="700">Samsung Galaxy S24 Ultra (256GB Titanium)</text>
      <text x="16" y="66" fill="#a1a1aa" font-size="11">Total: 2,400.00 ETB · Payment Method: Telebirr</text>
      <text x="16" y="85" fill="#fbbf24" font-size="11" font-weight="700">Gateway Status: Confirmed by Telebirr API</text>
    </g>

    <!-- Full reply workspace -->
    <g transform="translate(20, 560)">
      <rect width="754" height="80" rx="12" fill="#27272a" stroke="#3f3f46"/>
      <text x="20" y="32" fill="#71717a" font-size="13">Write message or type '/' for templates...</text>
      <rect x="670" y="24" width="70" height="36" rx="8" fill="#059669"/>
      <text x="690" y="46" fill="#ffffff" font-size="13" font-weight="700">Send</text>
    </g>
  </g>
</svg>`;

fs.writeFileSync(path.join(outDir, 'layout-1-three-column.svg'), svg1);
fs.writeFileSync(path.join(outDir, 'layout-2-kanban-board.svg'), svg2);
fs.writeFileSync(path.join(outDir, 'layout-3-full-studio.svg'), svg3);

console.log('Saved all 3 layout UI designs to:', outDir);
