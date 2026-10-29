import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outputDir = path.join(process.cwd(), 'public', 'assets', 'guide');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Common SVG Defs &amp; Background Generator
function makeSvg(title, stepNumber, contentSvg) {
  return `
<svg width="1200" height="680" viewBox="0 0 1200 680" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E1B3D"/>
      <stop offset="45%" stop-color="#0B57D0"/>
      <stop offset="100%" stop-color="#072A66"/>
    </linearGradient>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.12)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.04)"/>
    </linearGradient>
    <linearGradient id="blueAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#2563EB"/>
    </linearGradient>
    <linearGradient id="emeraldAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="amberAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="1200" height="680" rx="36" fill="url(#bgGrad)"/>

  <!-- Subtle Cyber Grid Lines -->
  <g opacity="0.08" stroke="#FFFFFF" stroke-width="1.5">
    <line x1="120" y1="0" x2="120" y2="680"/>
    <line x1="300" y1="0" x2="300" y2="680"/>
    <line x1="480" y1="0" x2="480" y2="680"/>
    <line x1="660" y1="0" x2="660" y2="680"/>
    <line x1="840" y1="0" x2="840" y2="680"/>
    <line x1="1020" y1="0" x2="1020" y2="680"/>
    <line x1="0" y1="120" x2="1200" y2="120"/>
    <line x1="0" y1="260" x2="1200" y2="260"/>
    <line x1="0" y1="400" x2="1200" y2="400"/>
    <line x1="0" y1="540" x2="1200" y2="540"/>
  </g>

  <!-- Ambient Glow Bubbles -->
  <circle cx="150" cy="120" r="140" fill="#38BDF8" opacity="0.18" filter="blur(60px)"/>
  <circle cx="1050" cy="550" r="160" fill="#2563EB" opacity="0.22" filter="blur(80px)"/>
  <circle cx="600" cy="340" r="120" fill="#10B981" opacity="0.12" filter="blur(70px)"/>

  <!-- Header Brand Bar -->
  <g transform="translate(60, 48)">
    <rect width="44" height="44" rx="14" fill="#2563EB" filter="url(#shadow)"/>
    <path d="M14 22C14 16.5 18.5 12 24 12C29.5 12 34 16.5 34 22C34 26 31 29 27 30V33H21V30C17 29 14 26 14 22Z" fill="#FFFFFF"/>
    <rect x="20" y="34" width="8" height="2" rx="1" fill="#FFFFFF"/>
    <text x="56" y="22" font-family="sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" letter-spacing="1">MINDMASTER ACADEMY</text>
    <text x="56" y="38" font-family="sans-serif" font-weight="700" font-size="11" fill="#38BDF8" letter-spacing="2">OFFICIAL STUDENT GUIDE • 2026</text>

    <!-- Step Badge -->
    <rect x="940" y="4" width="140" height="36" rx="18" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)"/>
    <circle cx="960" cy="22" r="6" fill="#10B981"/>
    <text x="976" y="26" font-family="sans-serif" font-weight="800" font-size="13" fill="#FFFFFF">${stepNumber}</text>
  </g>

  <!-- Title -->
  <text x="60" y="145" font-family="sans-serif" font-weight="900" font-size="28" fill="#FFFFFF" letter-spacing="-0.5">${title}</text>

  <!-- Custom Step Content -->
  ${contentSvg}
</svg>
`;
}

// 1. Step 1: Login &amp; Single Device
const step1Svg = makeSvg(
  'Step 1: Student OTP Login &amp; Strict Single-Device Lock',
  'STEP 01',
  `
  <!-- Left Card: Login Form Mockup -->
  <g transform="translate(60, 180)" filter="url(#shadow)">
    <rect width="480" height="440" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    
    <!-- Top Modal Header -->
    <rect width="480" height="72" rx="28" fill="#F8FAFC"/>
    <path d="M0 48H480V72H0z" fill="#F8FAFC"/>
    <text x="32" y="42" font-family="sans-serif" font-weight="900" font-size="18" fill="#0E1B3D">Student Login / विद्यार्थी लॉगिन</text>
    
    <!-- Mobile Input Field -->
    <text x="32" y="112" font-family="sans-serif" font-weight="700" font-size="13" fill="#64748B">Registered Mobile Number / मोबाईल क्रमांक</text>
    <rect x="32" y="126" width="416" height="54" rx="14" fill="#F1F5F9" stroke="#CBD5E1"/>
    <text x="48" y="160" font-family="sans-serif" font-weight="900" font-size="16" fill="#2563EB">+91</text>
    <line x1="90" y1="138" x2="90" y2="168" stroke="#CBD5E1" stroke-width="1.5"/>
    <text x="106" y="160" font-family="sans-serif" font-weight="800" font-size="16" fill="#0E1B3D">98765 44077</text>

    <!-- OTP Section -->
    <text x="32" y="218" font-family="sans-serif" font-weight="700" font-size="13" fill="#64748B">Enter 6-Digit OTP / ओटीपी प्रविष्ट करा</text>
    <g transform="translate(32, 232)">
      <rect x="0" y="0" width="56" height="56" rx="12" fill="#FFFFFF" stroke="#2563EB" stroke-width="2"/>
      <text x="22" y="37" font-family="sans-serif" font-weight="900" font-size="22" fill="#0E1B3D">5</text>

      <rect x="72" y="0" width="56" height="56" rx="12" fill="#FFFFFF" stroke="#2563EB" stroke-width="2"/>
      <text x="94" y="37" font-family="sans-serif" font-weight="900" font-size="22" fill="#0E1B3D">8</text>

      <rect x="144" y="0" width="56" height="56" rx="12" fill="#FFFFFF" stroke="#2563EB" stroke-width="2"/>
      <text x="166" y="37" font-family="sans-serif" font-weight="900" font-size="22" fill="#0E1B3D">3</text>

      <rect x="216" y="0" width="56" height="56" rx="12" fill="#FFFFFF" stroke="#2563EB" stroke-width="2"/>
      <text x="238" y="37" font-family="sans-serif" font-weight="900" font-size="22" fill="#0E1B3D">9</text>

      <rect x="288" y="0" width="56" height="56" rx="12" fill="#FFFFFF" stroke="#2563EB" stroke-width="2"/>
      <text x="310" y="37" font-family="sans-serif" font-weight="900" font-size="22" fill="#0E1B3D">2</text>

      <rect x="360" y="0" width="56" height="56" rx="12" fill="#FFFFFF" stroke="#2563EB" stroke-width="2"/>
      <text x="382" y="37" font-family="sans-serif" font-weight="900" font-size="22" fill="#0E1B3D">1</text>
    </g>

    <!-- Login Button -->
    <rect x="32" y="320" width="416" height="54" rx="16" fill="url(#blueAccent)"/>
    <text x="156" y="354" font-family="sans-serif" font-weight="900" font-size="16" fill="#FFFFFF">Verify OTP &amp; Start Studying →</text>

    <!-- Security Footnote -->
    <text x="90" y="405" font-family="sans-serif" font-weight="600" font-size="12" fill="#64748B">🔒 Encrypted session token tied to your personal handset</text>
  </g>

  <!-- Right Card: DRM Security Architecture Diagram -->
  <g transform="translate(580, 180)" filter="url(#shadow)">
    <rect width="560" height="440" rx="28" fill="#0A1633" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
    
    <text x="40" y="52" font-family="sans-serif" font-weight="900" font-size="20" fill="#FFFFFF">Single-Device Security Lock (DRM)</text>
    <text x="40" y="76" font-family="sans-serif" font-weight="600" font-size="13" fill="#94A3B8">Strict One Student • One Device Enforcement</text>

    <!-- Phone 1 (Active) -->
    <g transform="translate(40, 110)">
      <rect width="220" height="180" rx="20" fill="rgba(16,185,129,0.1)" stroke="#10B981" stroke-width="2"/>
      <circle cx="36" cy="36" r="16" fill="#10B981"/>
      <path d="M30 36L34 40L42 32" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
      <text x="64" y="36" font-family="sans-serif" font-weight="800" font-size="14" fill="#FFFFFF">Primary Handset</text>
      <text x="64" y="52" font-family="sans-serif" font-weight="600" font-size="11" fill="#34D399">Active Session</text>
      <text x="24" y="96" font-family="sans-serif" font-weight="700" font-size="13" fill="#E2E8F0">Device: Android 14</text>
      <text x="24" y="118" font-family="sans-serif" font-weight="600" font-size="11" fill="#94A3B8">Token: tok_active_9041</text>
      <rect x="24" y="134" width="172" height="28" rx="8" fill="#10B981"/>
      <text x="56" y="153" font-family="sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">● ACCESS ALLOWED</text>
    </g>

    <!-- Phone 2 (Blocked) -->
    <g transform="translate(300, 110)">
      <rect width="220" height="180" rx="20" fill="rgba(239,68,68,0.08)" stroke="#EF4444" stroke-width="2"/>
      <circle cx="36" cy="36" r="16" fill="#EF4444"/>
      <path d="M30 30L42 42M42 30L30 42" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
      <text x="64" y="36" font-family="sans-serif" font-weight="800" font-size="14" fill="#FFFFFF">Secondary Device</text>
      <text x="64" y="52" font-family="sans-serif" font-weight="600" font-size="11" fill="#F87171">Unauthorized Login</text>
      <text x="24" y="96" font-family="sans-serif" font-weight="700" font-size="13" fill="#E2E8F0">Device: Tablet / PC</text>
      <text x="24" y="118" font-family="sans-serif" font-weight="600" font-size="11" fill="#94A3B8">Status: Terminated</text>
      <rect x="24" y="134" width="172" height="28" rx="8" fill="#EF4444"/>
      <text x="62" y="153" font-family="sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">SESSION LOCKED</text>
    </g>

    <!-- Bottom Notice -->
    <g transform="translate(40, 316)">
      <rect width="480" height="96" rx="16" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
      <text x="24" y="36" font-family="sans-serif" font-weight="800" font-size="13" fill="#FCD34D">⚡ Changing Mobile Phone?</text>
      <text x="24" y="60" font-family="sans-serif" font-weight="600" font-size="12" fill="#E2E8F0">Simply open Settings &gt; In-App Support Desk and click &quot;Request Device Reset&quot;.</text>
      <text x="24" y="80" font-family="sans-serif" font-weight="600" font-size="11" fill="#94A3B8">Our Satara office approves genuine student resets within 2 hours.</text>
    </g>
  </g>
`
);

// 2. Step 2: Course Enrollment &amp; Coupon Code Checkout
const step2Svg = makeSvg(
  'Step 2: Course Selection, Coupon Code &amp; Razorpay Checkout',
  'STEP 02',
  `
  <!-- Left Card: Course Preview -->
  <g transform="translate(60, 180)" filter="url(#shadow)">
    <rect width="500" height="440" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    
    <!-- Course Banner Graphic Inside Card -->
    <rect width="500" height="150" rx="28" fill="#1E293B"/>
    <path d="M0 100H500V150H0z" fill="#1E293B"/>
    <text x="32" y="48" font-family="sans-serif" font-weight="900" font-size="13" fill="#38BDF8" letter-spacing="1">PREMIUM FLAGSHIP BATCH</text>
    <text x="32" y="82" font-family="sans-serif" font-weight="900" font-size="22" fill="#FFFFFF">Vedic Maths Mastery 2026</text>
    <text x="32" y="112" font-family="sans-serif" font-weight="700" font-size="13" fill="#94A3B8">Mentored by Prashant Dhumal Sir • 500-Year Calendar Speed Tricks</text>

    <!-- Course Inclusions -->
    <g transform="translate(32, 175)">
      <circle cx="12" cy="12" r="10" fill="#E0F2FE"/>
      <path d="M8 12L11 15L16 9" stroke="#0284C7" stroke-width="2"/>
      <text x="32" y="16" font-family="sans-serif" font-weight="700" font-size="13" fill="#1E293B">48+ HD Video Lessons (Unlimited Watch Time)</text>

      <circle cx="12" cy="48" r="10" fill="#E0F2FE"/>
      <path d="M8 48L11 51L16 45" stroke="#0284C7" stroke-width="2"/>
      <text x="32" y="52" font-family="sans-serif" font-weight="700" font-size="13" fill="#1E293B">Downloadable PDF Books &amp; Handwritten Mnemonic Notes</text>

      <circle cx="12" cy="84" r="10" fill="#E0F2FE"/>
      <path d="M8 84L11 87L16 81" stroke="#0284C7" stroke-width="2"/>
      <text x="32" y="88" font-family="sans-serif" font-weight="700" font-size="13" fill="#1E293B">Official ISO-Certified Completion Certificate with QR Code</text>

      <circle cx="12" cy="120" r="10" fill="#E0F2FE"/>
      <path d="M8 120L11 123L16 117" stroke="#0284C7" stroke-width="2"/>
      <text x="32" y="124" font-family="sans-serif" font-weight="700" font-size="13" fill="#1E293B">12 Months Full Access Validity</text>
    </g>

    <!-- Pricing Summary Box -->
    <rect x="32" y="335" width="436" height="74" rx="16" fill="#F8FAFC" stroke="#E2E8F0"/>
    <text x="52" y="365" font-family="sans-serif" font-weight="700" font-size="13" fill="#64748B">Course Fee / मूळ फी:</text>
    <text x="52" y="390" font-family="sans-serif" font-weight="900" font-size="20" fill="#0E1B3D">₹1,999</text>
    <text x="130" y="388" font-family="sans-serif" font-weight="700" font-size="14" fill="#94A3B8" text-decoration="line-through">₹4,999</text>
    <rect x="330" y="352" width="118" height="38" rx="12" fill="#2563EB"/>
    <text x="352" y="376" font-family="sans-serif" font-weight="900" font-size="13" fill="#FFFFFF">Enroll Now →</text>
  </g>

  <!-- Right Card: Checkout &amp; Coupon Box -->
  <g transform="translate(600, 180)" filter="url(#shadow)">
    <rect width="540" height="440" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    
    <text x="36" y="44" font-family="sans-serif" font-weight="900" font-size="18" fill="#0E1B3D">Order Summary &amp; Coupon Discount</text>

    <!-- Coupon Input Box -->
    <g transform="translate(36, 68)">
      <rect width="468" height="64" rx="16" fill="#F1F5F9" stroke="#10B981" stroke-width="2"/>
      <text x="20" y="38" font-family="sans-serif" font-weight="900" font-size="16" fill="#059669">FESTIVE500</text>
      <rect x="334" y="14" width="114" height="36" rx="10" fill="#10B981"/>
      <text x="350" y="37" font-family="sans-serif" font-weight="800" font-size="12" fill="#FFFFFF">✓ APPLIED</text>
    </g>

    <!-- Calculation Rows -->
    <g transform="translate(36, 155)" font-family="sans-serif" font-size="14">
      <text x="0" y="20" font-weight="600" fill="#64748B">Subtotal</text>
      <text x="468" y="20" font-weight="800" fill="#0E1B3D" text-anchor="end">₹1,999</text>

      <text x="0" y="52" font-weight="700" fill="#10B981">Special Academy Coupon (FESTIVE500)</text>
      <text x="468" y="52" font-weight="800" fill="#10B981" text-anchor="end">- ₹500</text>

      <text x="0" y="84" font-weight="600" fill="#64748B">GST &amp; Gateway Fees</text>
      <text x="468" y="84" font-weight="800" fill="#10B981" text-anchor="end">₹0 (Waived)</text>

      <line x1="0" y1="104" x2="468" y2="104" stroke="#E2E8F0" stroke-width="1.5"/>

      <text x="0" y="136" font-weight="900" font-size="16" fill="#0E1B3D">Total Payable / एकूण रक्कम</text>
      <text x="468" y="136" font-weight="900" font-size="22" fill="#2563EB" text-anchor="end">₹1,499</text>
    </g>

    <!-- Pay Button -->
    <rect x="36" y="324" width="468" height="54" rx="16" fill="url(#blueAccent)"/>
    <text x="150" y="357" font-family="sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">Pay Securely via Razorpay (₹1,499) 🔒</text>

    <!-- Gateway Badges -->
    <g transform="translate(70, 396)" opacity="0.8">
      <text x="0" y="14" font-family="sans-serif" font-weight="700" font-size="11" fill="#64748B">Supported: GPay • PhonePe • Paytm • UPI • NetBanking • Visa / Mastercard</text>
    </g>
  </g>
`
);

// 3. Step 3: HD Video Player &amp; Dynamic Watermark
const step3Svg = makeSvg(
  'Step 3: HD Video Player, Dynamic Watermark &amp; Offline Notes',
  'STEP 03',
  `
  <!-- Main Video Player Mockup -->
  <g transform="translate(60, 180)" filter="url(#shadow)">
    <rect width="680" height="440" rx="28" fill="#0A0F1D" stroke="#1E293B" stroke-width="2"/>
    
    <!-- Video Canvas -->
    <rect x="16" y="16" width="648" height="340" rx="20" fill="#020617"/>
    
    <!-- Prashant Sir Video Silhouette Mockup -->
    <circle cx="340" cy="160" r="50" fill="#1E3A8A"/>
    <path d="M260 260C260 215 295 180 340 180C385 180 420 215 420 260H260Z" fill="#1E3A8A"/>
    
    <!-- Chalkboard Math Formulas on Screen -->
    <text x="60" y="80" font-family="monospace" font-size="15" fill="#38BDF8" opacity="0.8">500-YEAR CALENDAR SPEED ALGORITHM:</text>
    <text x="60" y="110" font-family="monospace" font-size="20" font-weight="bold" fill="#FCD34D">(Day + MonthCode + CenturyCode) mod 7 = Day of Week</text>
    <text x="60" y="145" font-family="monospace" font-size="16" fill="#34D399">Example: 15 August 1947 =&gt; Friday (Instant mental calc)</text>

    <!-- DYNAMIC MOVING WATERMARK (Anti-Piracy) -->
    <g transform="translate(260, 200)" opacity="0.45">
      <rect x="-10" y="-18" width="280" height="32" rx="8" fill="rgba(0,0,0,0.6)"/>
      <text x="0" y="4" font-family="monospace" font-weight="900" font-size="13" fill="#EF4444">9876544077 • MINDMASTER DRM</text>
    </g>
    <g transform="translate(80, 280)" opacity="0.3">
      <text x="0" y="0" font-family="monospace" font-weight="900" font-size="12" fill="#FFFFFF">STD-demo-01 • Prashant Dhumal Sir</text>
    </g>

    <!-- Player Controls Bar -->
    <g transform="translate(16, 368)">
      <!-- Progress Bar -->
      <rect x="20" y="8" width="608" height="6" rx="3" fill="#334155"/>
      <rect x="20" y="8" width="280" height="6" rx="3" fill="#2563EB"/>
      <circle cx="300" cy="11" r="7" fill="#FFFFFF"/>

      <!-- Controls -->
      <circle cx="36" cy="38" r="16" fill="#2563EB"/>
      <polygon points="32,30 44,38 32,46" fill="#FFFFFF"/>
      <text x="64" y="42" font-family="sans-serif" font-weight="700" font-size="12" fill="#94A3B8">14:20 / 32:45</text>

      <rect x="480" y="24" width="60" height="26" rx="8" fill="#1E293B"/>
      <text x="495" y="41" font-family="sans-serif" font-weight="800" font-size="11" fill="#38BDF8">1.25x</text>

      <rect x="552" y="24" width="76" height="26" rx="8" fill="#1E293B"/>
      <text x="564" y="41" font-family="sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">1080p HD</text>
    </g>
  </g>

  <!-- Right Side: PDF Notes Viewer &amp; Download Card -->
  <g transform="translate(770, 180)" filter="url(#shadow)">
    <rect width="370" height="440" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    
    <text x="28" y="44" font-family="sans-serif" font-weight="900" font-size="18" fill="#0E1B3D">Course Study Notes</text>
    <text x="28" y="66" font-family="sans-serif" font-weight="600" font-size="12" fill="#64748B">Handwritten formulas &amp; practice sets</text>

    <!-- Note Item 1 -->
    <g transform="translate(24, 95)">
      <rect width="322" height="84" rx="16" fill="#F8FAFC" stroke="#E2E8F0"/>
      <rect x="16" y="16" width="50" height="52" rx="10" fill="#FEE2E2"/>
      <text x="28" y="48" font-family="sans-serif" font-weight="900" font-size="14" fill="#DC2626">PDF</text>
      <text x="78" y="38" font-family="sans-serif" font-weight="800" font-size="13" fill="#0E1B3D">Calendar Formulas.pdf</text>
      <text x="78" y="56" font-family="sans-serif" font-weight="600" font-size="11" fill="#64748B">2.4 MB • 14 Pages</text>
    </g>

    <!-- Note Item 2 -->
    <g transform="translate(24, 195)">
      <rect width="322" height="84" rx="16" fill="#F8FAFC" stroke="#E2E8F0"/>
      <rect x="16" y="16" width="50" height="52" rx="10" fill="#FEE2E2"/>
      <text x="28" y="48" font-family="sans-serif" font-weight="900" font-size="14" fill="#DC2626">PDF</text>
      <text x="78" y="38" font-family="sans-serif" font-weight="800" font-size="13" fill="#0E1B3D">Vedic Multiplication.pdf</text>
      <text x="78" y="56" font-family="sans-serif" font-weight="600" font-size="11" fill="#64748B">4.1 MB • 28 Pages</text>
    </g>

    <!-- Offline Sync Banner -->
    <g transform="translate(24, 295)">
      <rect width="322" height="110" rx="16" fill="#ECFDF5" stroke="#A7F3D0"/>
      <circle cx="28" cy="30" r="12" fill="#10B981"/>
      <path d="M23 30L26 33L33 27" stroke="#FFFFFF" stroke-width="2"/>
      <text x="50" y="34" font-family="sans-serif" font-weight="800" font-size="13" fill="#065F46">Offline Study Vault</text>
      <text x="20" y="64" font-family="sans-serif" font-weight="600" font-size="11" fill="#047857">Save PDF books to browser storage to read anytime without internet.</text>
      <rect x="20" y="74" width="282" height="26" rx="8" fill="#10B981"/>
      <text x="80" y="91" font-family="sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">Saved in PWA Vault ✓</text>
    </g>
  </g>
`
);

// 4. Step 4: Install PWA on Mobile &amp; Offline Mode
const step4Svg = makeSvg(
  'Step 4: Install MindMaster PWA App &amp; Offline Study Mode',
  'STEP 04',
  `
  <!-- Mobile Phone Mockup -->
  <g transform="translate(100, 180)" filter="url(#shadow)">
    <!-- Outer Phone Chassis -->
    <rect width="280" height="440" rx="42" fill="#1E293B" stroke="#475569" stroke-width="4"/>
    <rect x="12" y="12" width="256" height="416" rx="32" fill="#0F172A"/>
    
    <!-- Phone Notch -->
    <rect x="90" y="18" width="100" height="16" rx="8" fill="#1E293B"/>

    <!-- App Icon on Mobile Home Screen -->
    <g transform="translate(36, 60)">
      <rect width="56" height="56" rx="16" fill="#2563EB" filter="url(#shadow)"/>
      <circle cx="28" cy="28" r="14" fill="#FFFFFF" opacity="0.2"/>
      <path d="M20 28C20 23.5 23.5 20 28 20C32.5 20 36 23.5 36 28C36 31 34 33 30 34V36H26V34C22 33 20 31 20 28Z" fill="#FFFFFF"/>
      <text x="28" y="76" font-family="sans-serif" font-weight="800" font-size="10" fill="#FFFFFF" text-anchor="middle">MindMaster</text>
    </g>

    <g transform="translate(112, 60)">
      <rect width="56" height="56" rx="16" fill="#1E293B"/>
      <text x="140" y="76" font-family="sans-serif" font-weight="700" font-size="10" fill="#94A3B8" text-anchor="middle">Chrome</text>
    </g>

    <g transform="translate(188, 60)">
      <rect width="56" height="56" rx="16" fill="#1E293B"/>
      <text x="216" y="76" font-family="sans-serif" font-weight="700" font-size="10" fill="#94A3B8" text-anchor="middle">YouTube</text>
    </g>

    <!-- Simulated In-App PWA Install Banner -->
    <g transform="translate(24, 180)">
      <rect width="232" height="180" rx="18" fill="#1E293B" stroke="#38BDF8"/>
      <circle cx="116" cy="40" r="20" fill="#2563EB"/>
      <path d="M116 30V48M108 42L116 50L124 42" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
      <text x="116" y="80" font-family="sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" text-anchor="middle">Install MindMaster</text>
      <text x="116" y="100" font-family="sans-serif" font-weight="600" font-size="10" fill="#94A3B8" text-anchor="middle">Instant access from home screen</text>
      <rect x="26" y="120" width="180" height="36" rx="12" fill="#2563EB"/>
      <text x="116" y="143" font-family="sans-serif" font-weight="800" font-size="12" fill="#FFFFFF" text-anchor="middle">Add to Home Screen</text>
    </g>
  </g>

  <!-- Right Side: Installation Steps &amp; Offline Capability -->
  <g transform="translate(440, 180)" filter="url(#shadow)">
    <rect width="700" height="440" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    
    <text x="40" y="48" font-family="sans-serif" font-weight="900" font-size="20" fill="#0E1B3D">How to Install on Android &amp; iPhone</text>

    <!-- Android Step -->
    <g transform="translate(40, 75)">
      <rect width="620" height="84" rx="18" fill="#F8FAFC" stroke="#E2E8F0"/>
      <rect x="18" y="18" width="48" height="48" rx="12" fill="#E0F2FE"/>
      <text x="32" y="48" font-family="sans-serif" font-weight="900" font-size="16" fill="#0284C7">🤖</text>
      <text x="80" y="38" font-family="sans-serif" font-weight="900" font-size="14" fill="#0E1B3D">Android (Google Chrome):</text>
      <text x="80" y="58" font-family="sans-serif" font-weight="600" font-size="12" fill="#64748B">Open app in Chrome &gt; Tap 3 dots (top right) &gt; Click &quot;Install App&quot; or &quot;Add to Home Screen&quot;.</text>
    </g>

    <!-- iOS Step -->
    <g transform="translate(40, 175)">
      <rect width="620" height="84" rx="18" fill="#F8FAFC" stroke="#E2E8F0"/>
      <rect x="18" y="18" width="48" height="48" rx="12" fill="#FCE7F3"/>
      <text x="32" y="48" font-family="sans-serif" font-weight="900" font-size="16" fill="#DB2777">🍎</text>
      <text x="80" y="38" font-family="sans-serif" font-weight="900" font-size="14" fill="#0E1B3D">Apple iPhone (Safari Browser):</text>
      <text x="80" y="58" font-family="sans-serif" font-weight="600" font-size="12" fill="#64748B">Open in Safari &gt; Tap Share button (square with arrow) &gt; Select &quot;Add to Home Screen&quot;.</text>
    </g>

    <!-- Offline Feature Highlights -->
    <g transform="translate(40, 275)">
      <rect width="620" height="135" rx="20" fill="#ECFDF5" stroke="#10B981" stroke-width="1.5"/>
      <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="14" fill="#065F46">✨ Benefits of MindMaster PWA App:</text>
      
      <circle cx="36" cy="58" r="6" fill="#10B981"/>
      <text x="52" y="62" font-family="sans-serif" font-weight="700" font-size="12" fill="#047857">100% Fullscreen study experience — No browser URL bars or distractions.</text>

      <circle cx="36" cy="86" r="6" fill="#10B981"/>
      <text x="52" y="90" font-family="sans-serif" font-weight="700" font-size="12" fill="#047857">Service Worker Offline Cache — Read saved formulas and practice test questions without data.</text>

      <circle cx="36" cy="114" r="6" fill="#10B981"/>
      <text x="52" y="118" font-family="sans-serif" font-weight="700" font-size="12" fill="#047857">Ultra-lightweight (&lt; 2 MB) — Never uses up your phone storage.</text>
    </g>
  </g>
`
);

// 5. Step 5: Student Settings &amp; In-App Support Ticket Desk
const step5Svg = makeSvg(
  'Step 5: Student Settings &amp; In-App Support Ticket Desk',
  'STEP 05',
  `
  <!-- Left Side: Profile Settings Screen -->
  <g transform="translate(60, 180)" filter="url(#shadow)">
    <rect width="480" height="440" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    
    <text x="32" y="44" font-family="sans-serif" font-weight="900" font-size="18" fill="#0E1B3D">Student Settings / विद्यार्थी प्रोफाईल</text>

    <!-- Profile Header -->
    <g transform="translate(32, 65)">
      <circle cx="28" cy="28" r="28" fill="#2563EB"/>
      <text x="28" y="36" font-family="sans-serif" font-weight="900" font-size="18" fill="#FFFFFF" text-anchor="middle">RP</text>
      <text x="70" y="24" font-family="sans-serif" font-weight="900" font-size="15" fill="#0E1B3D">Rohan Patil</text>
      <text x="70" y="44" font-family="sans-serif" font-weight="600" font-size="12" fill="#64748B">+91 98765 44077 • Satara District</text>
    </g>

    <!-- Setting Menu Options -->
    <g transform="translate(32, 140)">
      <rect width="416" height="54" rx="14" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="20" y="32" font-family="sans-serif" font-weight="800" font-size="13" fill="#0E1B3D">🌐 Language / भाषा: English (Primary)</text>
      <text x="380" y="32" font-family="sans-serif" font-weight="700" font-size="13" fill="#2563EB">Change →</text>
    </g>

    <g transform="translate(32, 206)">
      <rect width="416" height="54" rx="14" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="20" y="32" font-family="sans-serif" font-weight="800" font-size="13" fill="#0E1B3D">📱 Active Device: Android 14 (Current Phone)</text>
    </g>

    <!-- Support Desk Highlight Card -->
    <g transform="translate(32, 272)">
      <rect width="416" height="130" rx="18" fill="#EFF6FF" stroke="#3B82F6" stroke-width="2"/>
      <circle cx="36" cy="36" r="16" fill="#2563EB"/>
      <path d="M30 36C30 32 33 29 37 29C41 29 44 32 44 36C44 40 40 43 37 43V46" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="37" cy="49" r="1.5" fill="#FFFFFF"/>
      <text x="64" y="34" font-family="sans-serif" font-weight="900" font-size="15" fill="#1E3A8A">In-App Support Ticket Desk</text>
      <text x="64" y="52" font-family="sans-serif" font-weight="600" font-size="12" fill="#2563EB">Fast help for payment, device reset &amp; courses</text>
      
      <rect x="24" y="74" width="368" height="40" rx="12" fill="#2563EB"/>
      <text x="140" y="99" font-family="sans-serif" font-weight="900" font-size="13" fill="#FFFFFF">+ Raise Support Ticket</text>
    </g>
  </g>

  <!-- Right Side: Ticket Submission &amp; Resolution Mockup -->
  <g transform="translate(580, 180)" filter="url(#shadow)">
    <rect width="560" height="440" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    
    <text x="36" y="44" font-family="sans-serif" font-weight="900" font-size="18" fill="#0E1B3D">Live Ticket Resolution Workflow</text>

    <!-- Active Ticket Preview -->
    <g transform="translate(36, 68)">
      <rect width="488" height="150" rx="18" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="14" fill="#0E1B3D">Ticket #MM-2041: Device Reset Request</text>
      <rect x="370" y="16" width="94" height="26" rx="8" fill="#10B981"/>
      <text x="388" y="33" font-family="sans-serif" font-weight="800" font-size="11" fill="#FFFFFF">RESOLVED ✓</text>
      
      <text x="24" y="64" font-family="sans-serif" font-weight="600" font-size="12" fill="#64748B">Category: Request Device Reset • Oct 28, 2026</text>
      <rect x="24" y="80" width="440" height="52" rx="10" fill="#ECFDF5" stroke="#A7F3D0"/>
      <text x="38" y="100" font-family="sans-serif" font-weight="800" font-size="11" fill="#065F46">Admin Reply (Prashant Dhumal Sir / Staff):</text>
      <text x="38" y="118" font-family="sans-serif" font-weight="600" font-size="11" fill="#047857">&quot;Old session revoked. You can now log in on your new handset.&quot;</text>
    </g>

    <!-- Support Categories Box -->
    <g transform="translate(36, 240)">
      <text x="0" y="20" font-family="sans-serif" font-weight="800" font-size="13" fill="#64748B">Available In-App Categories:</text>
      
      <g transform="translate(0, 36)">
        <rect width="230" height="42" rx="10" fill="#EFF6FF" stroke="#BFDBFE"/>
        <text x="14" y="26" font-family="sans-serif" font-weight="700" font-size="12" fill="#1D4ED8">💳 Payment / Course Access</text>

        <rect x="246" y="0" width="230" height="42" rx="10" fill="#FEF3C7" stroke="#FDE68A"/>
        <text x="260" y="26" font-family="sans-serif" font-weight="700" font-size="12" fill="#B45309">📱 Request Device Reset</text>
      </g>

      <g transform="translate(0, 90)">
        <rect width="230" height="42" rx="10" fill="#F3E8FF" stroke="#E9D5FF"/>
        <text x="14" y="26" font-family="sans-serif" font-weight="700" font-size="12" fill="#7E22CE">🎓 Certificate &amp; Exam Help</text>

        <rect x="246" y="0" width="230" height="42" rx="10" fill="#F1F5F9" stroke="#CBD5E1"/>
        <text x="260" y="26" font-family="sans-serif" font-weight="700" font-size="12" fill="#475569">⚙️ Other Technical Query</text>
      </g>
    </g>
  </g>
`
);

// 6. Step 6: 100% Course Completion &amp; Verifiable QR Certificate
const step6Svg = makeSvg(
  'Step 6: 100% Course Completion &amp; Verifiable QR Certificate',
  'STEP 06',
  `
  <!-- Certificate Document Card -->
  <g transform="translate(60, 180)" filter="url(#shadow)">
    <rect width="700" height="440" rx="28" fill="#FFFDF8" stroke="#D4AF37" stroke-width="4"/>
    
    <!-- Ornate Inner Frame -->
    <rect x="18" y="18" width="664" height="404" rx="20" fill="none" stroke="#E5C07B" stroke-width="1.5" stroke-dasharray="6,4"/>

    <!-- Certificate Header -->
    <text x="350" y="66" font-family="serif" font-weight="900" font-size="14" fill="#B45309" text-anchor="middle" letter-spacing="3">MINDMASTER ACADEMY • SATARA</text>
    <text x="350" y="104" font-family="serif" font-weight="900" font-size="26" fill="#0E1B3D" text-anchor="middle">Certificate of Completion</text>
    <text x="350" y="132" font-family="sans-serif" font-weight="600" font-size="12" fill="#64748B" text-anchor="middle">This is to officially certify that</text>

    <!-- Student Name -->
    <text x="350" y="174" font-family="serif" font-weight="900" font-size="28" fill="#1E3A8A" text-anchor="middle">Rohan Dilip Patil</text>
    <line x1="180" y1="188" x2="520" y2="188" stroke="#D4AF37" stroke-width="1"/>

    <!-- Course Info -->
    <text x="350" y="214" font-family="sans-serif" font-weight="600" font-size="13" fill="#334155" text-anchor="middle">has successfully completed 100% curriculum of</text>
    <text x="350" y="240" font-family="sans-serif" font-weight="900" font-size="17" fill="#0E1B3D" text-anchor="middle">Mastery in Vedic Mathematics &amp; Speed Calculations</text>
    <text x="350" y="262" font-family="sans-serif" font-weight="700" font-size="12" fill="#059669" text-anchor="middle">Graded: A+ Distinction • 100% Watched</text>

    <!-- Signatures &amp; Badges -->
    <g transform="translate(60, 310)">
      <line x1="0" y1="40" x2="160" y2="40" stroke="#0E1B3D" stroke-width="1.5"/>
      <text x="80" y="32" font-family="serif" font-style="italic" font-weight="bold" font-size="16" fill="#1E3A8A" text-anchor="middle">Prashant Dhumal</text>
      <text x="80" y="60" font-family="sans-serif" font-weight="800" font-size="11" fill="#0E1B3D" text-anchor="middle">Prashant Dhumal Sir</text>
      <text x="80" y="76" font-family="sans-serif" font-weight="600" font-size="10" fill="#64748B" text-anchor="middle">Founder &amp; Master Trainer</text>
    </g>

    <!-- Gold Foil Ribbon Badge -->
    <g transform="translate(305, 290)">
      <circle cx="45" cy="45" r="36" fill="#D97706"/>
      <circle cx="45" cy="45" r="30" fill="#F59E0B"/>
      <polygon points="45,24 51,36 64,36 53,44 57,56 45,48 33,56 37,44 26,36 39,36" fill="#FFFFFF"/>
      <text x="45" y="70" font-family="sans-serif" font-weight="900" font-size="8" fill="#78350F" text-anchor="middle">ISO 9001:2015</text>
    </g>

    <!-- QR Code Mockup -->
    <g transform="translate(520, 290)">
      <rect width="100" height="100" rx="12" fill="#FFFFFF" stroke="#0E1B3D" stroke-width="2"/>
      <!-- QR Blocks -->
      <rect x="14" y="14" width="24" height="24" fill="#0E1B3D"/>
      <rect x="18" y="18" width="16" height="16" fill="#FFFFFF"/>
      <rect x="22" y="22" width="8" height="8" fill="#0E1B3D"/>

      <rect x="62" y="14" width="24" height="24" fill="#0E1B3D"/>
      <rect x="66" y="18" width="16" height="16" fill="#FFFFFF"/>
      <rect x="70" y="22" width="8" height="8" fill="#0E1B3D"/>

      <rect x="14" y="62" width="24" height="24" fill="#0E1B3D"/>
      <rect x="18" y="66" width="16" height="16" fill="#FFFFFF"/>
      <rect x="22" y="70" width="8" height="8" fill="#0E1B3D"/>

      <rect x="46" y="46" width="10" height="10" fill="#0E1B3D"/>
      <rect x="62" y="56" width="12" height="12" fill="#0E1B3D"/>
      <rect x="46" y="66" width="10" height="20" fill="#0E1B3D"/>

      <text x="50" y="122" font-family="sans-serif" font-weight="800" font-size="9" fill="#0E1B3D" text-anchor="middle">Scan to Verify Online</text>
    </g>
  </g>

  <!-- Right Side: Claim &amp; Verification Instructions -->
  <g transform="translate(790, 180)" filter="url(#shadow)">
    <rect width="350" height="440" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    
    <text x="28" y="44" font-family="sans-serif" font-weight="900" font-size="18" fill="#0E1B3D">Claiming Your Certificate</text>
    
    <g transform="translate(24, 70)">
      <rect width="302" height="74" rx="14" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="24" cy="24" r="12" fill="#2563EB"/>
      <text x="24" y="28" font-family="sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">1</text>
      <text x="46" y="26" font-family="sans-serif" font-weight="800" font-size="13" fill="#0E1B3D">Watch 100% of Lessons</text>
      <text x="24" y="54" font-family="sans-serif" font-weight="600" font-size="11" fill="#64748B">System tracks real watch time to unlock the claim button.</text>
    </g>

    <g transform="translate(24, 156)">
      <rect width="302" height="74" rx="14" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="24" cy="24" r="12" fill="#2563EB"/>
      <text x="24" y="28" font-family="sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">2</text>
      <text x="46" y="26" font-family="sans-serif" font-weight="800" font-size="13" fill="#0E1B3D">Confirm Legal Name</text>
      <text x="24" y="54" font-family="sans-serif" font-weight="600" font-size="11" fill="#64748B">Matches school record for government and school validity.</text>
    </g>

    <g transform="translate(24, 242)">
      <rect width="302" height="74" rx="14" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="24" cy="24" r="12" fill="#2563EB"/>
      <text x="24" y="28" font-family="sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">3</text>
      <text x="46" y="26" font-family="sans-serif" font-weight="800" font-size="13" fill="#0E1B3D">Instant PDF Download</text>
      <text x="24" y="54" font-family="sans-serif" font-weight="600" font-size="11" fill="#64748B">Printable A4 high-res vector with live verification QR.</text>
    </g>

    <rect x="24" y="340" width="302" height="48" rx="14" fill="url(#blueAccent)"/>
    <text x="80" y="370" font-family="sans-serif" font-weight="900" font-size="13" fill="#FFFFFF">Verify at /verify-certificate</text>
  </g>
`
);

// 7. Admin &amp; Sub-Admin SOP: Ticket Resolution &amp; Manual Course Grants
const step7Svg = makeSvg(
  'Admin SOP: Ticket Review, Call Student &amp; Manual Grants',
  'ADMIN SOP',
  `
  <!-- Left Side: Sub-Admin Ticket Desk Card -->
  <g transform="translate(60, 180)" filter="url(#shadow)">
    <rect width="520" height="440" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    
    <text x="32" y="44" font-family="sans-serif" font-weight="900" font-size="18" fill="#0E1B3D">Sub-Admin Ticket Management Desk</text>
    <text x="32" y="66" font-family="sans-serif" font-weight="600" font-size="12" fill="#64748B">Review issues, call students &amp; approve resets</text>

    <!-- Ticket Card 1 -->
    <g transform="translate(24, 85)">
      <rect width="472" height="150" rx="18" fill="#F8FAFC" stroke="#CBD5E1"/>
      <text x="20" y="32" font-family="sans-serif" font-weight="900" font-size="14" fill="#0E1B3D">Student: Aarav Deshmukh (Satara)</text>
      <rect x="360" y="16" width="92" height="26" rx="8" fill="#FEF3C7"/>
      <text x="375" y="33" font-family="sans-serif" font-weight="800" font-size="11" fill="#B45309">PENDING</text>
      
      <text x="20" y="62" font-family="sans-serif" font-weight="600" font-size="12" fill="#475569">Issue: &quot;Purchased new phone, cannot log in due to device lock.&quot;</text>
      
      <!-- Action Buttons -->
      <g transform="translate(20, 88)">
        <!-- Call Button -->
        <rect width="180" height="40" rx="12" fill="#10B981"/>
        <text x="40" y="25" font-family="sans-serif" font-weight="800" font-size="12" fill="#FFFFFF">📞 Call (+91 98765...)</text>

        <!-- Approve Reset -->
        <rect x="194" width="238" height="40" rx="12" fill="#2563EB"/>
        <text x="220" y="25" font-family="sans-serif" font-weight="800" font-size="12" fill="#FFFFFF">✓ Approve Device Reset</text>
      </g>
    </g>

    <!-- Sub-Admin Protocol Rules -->
    <g transform="translate(24, 255)">
      <rect width="472" height="145" rx="18" fill="#F1F5F9" stroke="#E2E8F0"/>
      <text x="20" y="30" font-family="sans-serif" font-weight="900" font-size="13" fill="#0E1B3D">📋 Sub-Admin Verification Protocol:</text>
      
      <circle cx="28" cy="54" r="5" fill="#2563EB"/>
      <text x="42" y="58" font-family="sans-serif" font-weight="600" font-size="11" fill="#334155">Always click &quot;Call Student&quot; to verify genuine handset change.</text>

      <circle cx="28" cy="82" r="5" fill="#2563EB"/>
      <text x="42" y="86" font-family="sans-serif" font-weight="600" font-size="11" fill="#334155">Confirm student&apos;s registered name and city before clearing session.</text>

      <circle cx="28" cy="110" r="5" fill="#2563EB"/>
      <text x="42" y="114" font-family="sans-serif" font-weight="600" font-size="11" fill="#334155">All staff approvals are audited with timestamp in admin/my-activity.</text>
    </g>
  </g>

  <!-- Right Side: Manual Course Grants Workflow -->
  <g transform="translate(600, 180)" filter="url(#shadow)">
    <rect width="540" height="440" rx="28" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    
    <text x="36" y="44" font-family="sans-serif" font-weight="900" font-size="18" fill="#0E1B3D">Offline Student Course Grant (admin/grants)</text>
    <text x="36" y="66" font-family="sans-serif" font-weight="600" font-size="12" fill="#64748B">Issue manual access after offline cash/fee receipt verification</text>

    <!-- Grant Form Simulation -->
    <g transform="translate(36, 90)">
      <text x="0" y="16" font-family="sans-serif" font-weight="700" font-size="12" fill="#475569">Student Mobile Number / मोबाईल क्रमांक</text>
      <rect x="0" y="24" width="468" height="46" rx="12" fill="#F8FAFC" stroke="#CBD5E1"/>
      <text x="16" y="53" font-family="sans-serif" font-weight="800" font-size="14" fill="#0E1B3D">+91 84593 44077 (Verified Profile)</text>

      <text x="0" y="96" font-family="sans-serif" font-weight="700" font-size="12" fill="#475569">Select Course to Grant</text>
      <rect x="0" y="104" width="468" height="46" rx="12" fill="#F8FAFC" stroke="#CBD5E1"/>
      <text x="16" y="133" font-family="sans-serif" font-weight="800" font-size="14" fill="#0E1B3D">Vedic Maths Mastery (12 Months Access)</text>

      <text x="0" y="176" font-family="sans-serif" font-weight="700" font-size="12" fill="#475569">Satara Center Offline Pavati (Receipt) Number</text>
      <rect x="0" y="184" width="468" height="46" rx="12" fill="#F8FAFC" stroke="#CBD5E1"/>
      <text x="16" y="213" font-family="sans-serif" font-weight="800" font-size="14" fill="#0E1B3D">REC-SATARA-2026-904</text>
    </g>

    <!-- Submit Grant Button -->
    <rect x="36" y="345" width="468" height="52" rx="16" fill="url(#emeraldAccent)"/>
    <text x="160" y="377" font-family="sans-serif" font-weight="900" font-size="14" fill="#FFFFFF">Grant Instant ₹0 Access ✓</text>
  </g>
`
);

async function run() {
  console.log('Generating high-resolution WebP guide assets from vector SVG mockups...');
  
  const jobs = [
    { name: 'step-1-login-device.webp', svg: step1Svg },
    { name: 'step-2-buy-course-coupon.webp', svg: step2Svg },
    { name: 'step-3-watch-video-notes.webp', svg: step3Svg },
    { name: 'step-4-install-pwa.webp', svg: step4Svg },
    { name: 'step-5-raise-ticket.webp', svg: step5Svg },
    { name: 'step-6-claim-certificate.webp', svg: step6Svg },
    { name: 'admin-sop-tickets-grants.webp', svg: step7Svg },
  ];

  for (const job of jobs) {
    const dest = path.join(outputDir, job.name);
    await sharp(Buffer.from(job.svg))
      .webp({ quality: 90 })
      .toFile(dest);
    console.log(`✓ Created ${job.name}`);
  }

  console.log('🎉 All 7 guide visual assets generated successfully in public/assets/guide/!');
}

run().catch((err) => {
  console.error('Error generating guide graphics:', err);
  process.exit(1);
});
