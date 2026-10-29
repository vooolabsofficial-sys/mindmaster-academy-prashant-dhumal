import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outputDir = path.join(process.cwd(), 'public', 'assets', 'guide');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Legal Privacy Banner SVG (Data Encryption, RLS, PCI-DSS Shield)
const privacySvg = `
<svg width="1200" height="500" viewBox="0 0 1200 500" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E1B3D"/>
      <stop offset="50%" stop-color="#0B57D0"/>
      <stop offset="100%" stop-color="#083884"/>
    </linearGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.12)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.03)"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="500" rx="32" fill="url(#pBg)"/>

  <!-- Subtle Cyber Grid -->
  <g opacity="0.12" stroke="#FFFFFF" stroke-width="1">
    <line x1="100" y1="0" x2="100" y2="500"/>
    <line x1="250" y1="0" x2="250" y2="500"/>
    <line x1="400" y1="0" x2="400" y2="500"/>
    <line x1="550" y1="0" x2="550" y2="500"/>
    <line x1="700" y1="0" x2="700" y2="500"/>
    <line x1="850" y1="0" x2="850" y2="500"/>
    <line x1="1000" y1="0" x2="1000" y2="500"/>
    <line x1="0" y1="100" x2="1200" y2="100"/>
    <line x1="0" y1="250" x2="1200" y2="250"/>
    <line x1="0" y1="400" x2="1200" y2="400"/>
  </g>

  <!-- Decorative Ambient Glows -->
  <circle cx="200" cy="150" r="140" fill="#38BDF8" opacity="0.15" filter="url(#glow)"/>
  <circle cx="950" cy="260" r="180" fill="#10B981" opacity="0.2" filter="url(#glow)"/>

  <!-- Left Text & Compliance Badges -->
  <g transform="translate(80, 110)">
    <!-- Pill Badge -->
    <rect width="260" height="38" rx="19" fill="#1E293B" stroke="#38BDF8" stroke-width="1.5"/>
    <circle cx="20" cy="19" r="6" fill="#10B981"/>
    <text x="36" y="24" fill="#E0F2FE" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" letter-spacing="1.5">DATA PRIVACY &amp; SECURITY</text>

    <!-- Main Title -->
    <text x="0" y="90" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" letter-spacing="-0.5">Student Privacy &amp; Data Shield</text>
    <text x="0" y="130" fill="#93C5FD" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600">Enterprise Encrypted Storage • Zero Raw Payment Data Retained</text>

    <!-- 3 Core Feature Tags -->
    <g transform="translate(0, 180)">
      <!-- Tag 1 -->
      <rect x="0" y="0" width="180" height="42" rx="12" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.2)"/>
      <text x="20" y="26" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="700">🔒 Supabase RLS</text>

      <!-- Tag 2 -->
      <rect x="195" y="0" width="180" height="42" rx="12" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.2)"/>
      <text x="215" y="26" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="700">💳 PCI-DSS Gateway</text>

      <!-- Tag 3 -->
      <rect x="390" y="0" width="200" height="42" rx="12" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.2)"/>
      <text x="410" y="26" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="700">📱 1-Device DRM Lock</text>
    </g>
  </g>

  <!-- Right Visual Graphics: Central Security Shield with Lock & Database Nodes -->
  <g transform="translate(860, 240)">
    <!-- Outer Floating Pulse Ring -->
    <circle cx="0" cy="0" r="140" fill="none" stroke="#60A5FA" stroke-width="2" stroke-dasharray="8 8" opacity="0.4"/>
    <circle cx="0" cy="0" r="170" fill="none" stroke="#34D399" stroke-width="1.5" stroke-dasharray="12 12" opacity="0.3"/>

    <!-- Glass Central Base -->
    <circle cx="0" cy="0" r="110" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>

    <!-- Shield Vector -->
    <path d="M 0 -65 L 50 -40 C 50 15, 30 55, 0 75 C -30 55, -50 15, -50 -40 Z" fill="url(#shieldGrad)" filter="url(#glow)"/>

    <!-- Inner Padlock Icon -->
    <!-- Shackle -->
    <path d="M -16 -8 C -16 -24, 16 -24, 16 -8" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
    <!-- Body -->
    <rect x="-22" y="-8" width="44" height="34" rx="7" fill="#FFFFFF"/>
    <!-- Keyhole -->
    <circle cx="0" cy="6" r="3.5" fill="#065F46"/>
    <path d="M -1.5 6 L 1.5 6 L 2 17 L -2 17 Z" fill="#065F46"/>

    <!-- Surrounding Security Nodes -->
    <g transform="translate(100, -80)">
      <circle cx="0" cy="0" r="24" fill="#0E1B3D" stroke="#38BDF8" stroke-width="2"/>
      <text x="-10" y="6" fill="#38BDF8" font-family="monospace" font-size="16" font-weight="bold">SSL</text>
    </g>
    <g transform="translate(-110, 80)">
      <circle cx="0" cy="0" r="24" fill="#0E1B3D" stroke="#34D399" stroke-width="2"/>
      <text x="-10" y="6" fill="#34D399" font-family="monospace" font-size="16" font-weight="bold">RLS</text>
    </g>
    <g transform="translate(-110, -80)">
      <circle cx="0" cy="0" r="24" fill="#0E1B3D" stroke="#FBBF24" stroke-width="2"/>
      <text x="-9" y="6" fill="#FBBF24" font-family="system-ui" font-size="16">🛡️</text>
    </g>
  </g>
</svg>
`;

// 2. Legal Terms & Conditions Banner SVG (Single Device DRM, Anti-Piracy Warning, Copyright Act)
const termsSvg = `
<svg width="1200" height="500" viewBox="0 0 1200 500" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E172A"/>
      <stop offset="50%" stop-color="#1E1B4B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="cardGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.1)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.02)"/>
    </linearGradient>
    <filter id="glow2" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="1200" height="500" rx="32" fill="url(#tBg)"/>

  <!-- Ambient Light Orbs -->
  <circle cx="250" cy="200" r="160" fill="#6366F1" opacity="0.16" filter="url(#glow2)"/>
  <circle cx="950" cy="250" r="190" fill="#F59E0B" opacity="0.18" filter="url(#glow2)"/>

  <!-- Left Text -->
  <g transform="translate(80, 110)">
    <rect width="280" height="38" rx="19" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
    <circle cx="20" cy="19" r="6" fill="#F59E0B"/>
    <text x="36" y="24" fill="#FEF3C7" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" letter-spacing="1.5">TERMS &amp; CODE OF CONDUCT</text>

    <text x="0" y="90" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" letter-spacing="-0.5">Terms of Service &amp; DRM Rules</text>
    <text x="0" y="130" fill="#CBD5E1" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600">Strict Anti-Piracy Policy • Indian Copyright Act, 1957 Compliance</text>

    <!-- 3 Tags -->
    <g transform="translate(0, 180)">
      <rect x="0" y="0" width="200" height="42" rx="12" fill="url(#cardGrad2)" stroke="rgba(255,255,255,0.2)"/>
      <text x="20" y="26" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="700">🚫 Anti-Screen Recording</text>

      <rect x="215" y="0" width="210" height="42" rx="12" fill="url(#cardGrad2)" stroke="rgba(255,255,255,0.2)"/>
      <text x="235" y="26" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="700">🛡️ Forensic Watermarking</text>

      <rect x="440" y="0" width="180" height="42" rx="12" fill="url(#cardGrad2)" stroke="rgba(255,255,255,0.2)"/>
      <text x="460" y="26" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="700">⚖️ Indian IT Act 2000</text>
    </g>
  </g>

  <!-- Right Graphic: Scale of Justice + Device DRM Protection Warning -->
  <g transform="translate(860, 240)">
    <circle cx="0" cy="0" r="140" fill="none" stroke="#F59E0B" stroke-width="2" stroke-dasharray="10 10" opacity="0.3"/>
    <circle cx="0" cy="0" r="110" fill="url(#cardGrad2)" stroke="rgba(245,158,11,0.4)" stroke-width="2"/>

    <!-- Scales of Justice Symbol -->
    <!-- Pillar -->
    <rect x="-4" y="-70" width="8" height="130" rx="3" fill="#FDE68A"/>
    <!-- Top Bar -->
    <rect x="-65" y="-50" width="130" height="6" rx="3" fill="#FDE68A"/>
    <!-- Center Finial -->
    <polygon points="0,-75 -12,-65 12,-65" fill="#F59E0B"/>

    <!-- Left Plate -->
    <line x1="-55" y1="-50" x2="-75" y2="-10" stroke="#FDE68A" stroke-width="2"/>
    <line x1="-55" y1="-50" x2="-35" y2="-10" stroke="#FDE68A" stroke-width="2"/>
    <path d="M -85 -10 Q -55 10 -25 -10 Z" fill="url(#amberGrad)"/>

    <!-- Right Plate -->
    <line x1="55" y1="-50" x2="35" y2="-10" stroke="#FDE68A" stroke-width="2"/>
    <line x1="55" y1="-50" x2="75" y2="-10" stroke="#FDE68A" stroke-width="2"/>
    <path d="M 25 -10 Q 55 10 85 -10 Z" fill="url(#amberGrad)"/>

    <!-- Base -->
    <path d="M -30 60 L 30 60 L 40 70 L -40 70 Z" fill="#FDE68A"/>

    <!-- Satellite Watermark / DRM Nodes -->
    <g transform="translate(100, -80)">
      <circle cx="0" cy="0" r="26" fill="#0F172A" stroke="#EF4444" stroke-width="2"/>
      <text x="-12" y="7" fill="#EF4444" font-family="system-ui" font-size="18" font-weight="bold">DRM</text>
    </g>
    <g transform="translate(-110, 80)">
      <circle cx="0" cy="0" r="26" fill="#0F172A" stroke="#F59E0B" stroke-width="2"/>
      <text x="-9" y="8" fill="#F59E0B" font-family="system-ui" font-size="20">©</text>
    </g>
  </g>
</svg>
`;

// 3. Legal Refund Policy Banner SVG (100% Duplicate Deduction Reversal, Razorpay Sync)
const refundSvg = `
<svg width="1200" height="500" viewBox="0 0 1200 500" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#022C22"/>
      <stop offset="50%" stop-color="#064E3B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2DD4BF"/>
      <stop offset="100%" stop-color="#0D9488"/>
    </linearGradient>
    <linearGradient id="cardGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.12)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.03)"/>
    </linearGradient>
    <filter id="glow3" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <rect width="1200" height="500" rx="32" fill="url(#rBg)"/>

  <!-- Glows -->
  <circle cx="220" cy="180" r="150" fill="#14B8A6" opacity="0.18" filter="url(#glow3)"/>
  <circle cx="950" cy="250" r="180" fill="#10B981" opacity="0.22" filter="url(#glow3)"/>

  <!-- Left Content -->
  <g transform="translate(80, 110)">
    <rect width="280" height="38" rx="19" fill="#064E3B" stroke="#2DD4BF" stroke-width="1.5"/>
    <circle cx="20" cy="19" r="6" fill="#34D399"/>
    <text x="36" y="24" fill="#CCFBF1" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" letter-spacing="1.5">HONEST BILLING &amp; REFUNDS</text>

    <text x="0" y="90" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" letter-spacing="-0.5">Cancellation &amp; Refund Policy</text>
    <text x="0" y="130" fill="#A7F3D0" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600">100% Refund for Duplicate Deductions • 5–7 Working Days Direct Credit</text>

    <!-- 3 Tags -->
    <g transform="translate(0, 180)">
      <rect x="0" y="0" width="220" height="42" rx="12" fill="url(#cardGrad3)" stroke="rgba(255,255,255,0.2)"/>
      <text x="20" y="26" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="700">⚡ Automated Reversal</text>

      <rect x="235" y="0" width="200" height="42" rx="12" fill="url(#cardGrad3)" stroke="rgba(255,255,255,0.2)"/>
      <text x="255" y="26" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="700">⏱️ 5–7 Days Credit</text>

      <rect x="450" y="0" width="180" height="42" rx="12" fill="url(#cardGrad3)" stroke="rgba(255,255,255,0.2)"/>
      <text x="470" y="26" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="13" font-weight="700">🎫 In-App Ticket Desk</text>
    </g>
  </g>

  <!-- Right Graphic: Reversal Arrows & Verified Currency Shield -->
  <g transform="translate(860, 240)">
    <circle cx="0" cy="0" r="140" fill="none" stroke="#2DD4BF" stroke-width="2" stroke-dasharray="10 10" opacity="0.35"/>
    <circle cx="0" cy="0" r="110" fill="url(#cardGrad3)" stroke="rgba(45,212,191,0.4)" stroke-width="2"/>

    <!-- Circular Reversal Arrow -->
    <path d="M -55 -15 A 55 55 0 1 1 -15 55" fill="none" stroke="#34D399" stroke-width="8" stroke-linecap="round"/>
    <polygon points="-55,-35 -75,-10 -40,-10" fill="#34D399"/>

    <!-- Rupee Shield in Center -->
    <circle cx="0" cy="0" r="42" fill="url(#tealGrad)" filter="url(#glow3)"/>
    <text x="-14" y="15" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900">₹</text>

    <!-- Satellite Nodes -->
    <g transform="translate(100, -80)">
      <circle cx="0" cy="0" r="26" fill="#064E3B" stroke="#34D399" stroke-width="2"/>
      <text x="-9" y="8" fill="#34D399" font-family="system-ui" font-size="18">✓</text>
    </g>
    <g transform="translate(-110, 80)">
      <circle cx="0" cy="0" r="26" fill="#064E3B" stroke="#2DD4BF" stroke-width="2"/>
      <text x="-12" y="6" fill="#2DD4BF" font-family="monospace" font-size="14" font-weight="bold">UPI</text>
    </g>
  </g>
</svg>
`;

async function generate() {
  console.log('Generating WebP banners from vector SVG art...');

  await sharp(Buffer.from(privacySvg))
    .webp({ quality: 95 })
    .toFile(path.join(outputDir, 'legal-privacy.webp'));
  console.log('✓ Created legal-privacy.webp');

  await sharp(Buffer.from(termsSvg))
    .webp({ quality: 95 })
    .toFile(path.join(outputDir, 'legal-terms.webp'));
  console.log('✓ Created legal-terms.webp');

  await sharp(Buffer.from(refundSvg))
    .webp({ quality: 95 })
    .toFile(path.join(outputDir, 'legal-refund.webp'));
  console.log('✓ Created legal-refund.webp');

  console.log('🎉 All 3 legal visual banners generated successfully!');
}

generate().catch(console.error);
