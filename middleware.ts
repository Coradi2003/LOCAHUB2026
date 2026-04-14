import { next } from '@vercel/functions';

// ─── BLOCKLIST ────────────────────────────────────────────────────────────────
const BOT_BLOCKLIST = [
  // Scrapers / HTTP libraries
  'scrapy', 'crawler', 'spider', 'scraper',
  'wget', 'python-requests', 'python-urllib', 'python-httpx', 'aiohttp',
  'go-http-client', 'okhttp', 'node-fetch', 'got/',
  'phin', 'superagent', 'needle', 'axios/',
  // Ferramentas de ataque / reconhecimento
  'zgrab', 'masscan', 'nikto', 'sqlmap', 'nuclei',
  'dirbuster', 'gobuster', 'ffuf', 'wfuzz', 'burpsuite',
  'nessus', 'openvas', 'acunetix', 'appscan',
  // Bots de SEO agressivos
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'petalbot',
  'yandexbot', 'baiduspider', 'rogerbot', 'blexbot', 'exabot',
  'dataprovider', 'linkdexbot', 'spbot', 'seokicks',
  // Headless / automação
  'headlesschrome', 'phantomjs', 'selenium', 'webdriver', 'puppeteer',
  'playwright', 'cypress', 'testcafe', 'nightmare',
];

// ─── ALLOWLIST ────────────────────────────────────────────────────────────────
// Prioridade absoluta — nunca bloqueados.
const ALLOWED_BOTS = [
  // Motores de busca
  'googlebot', 'google-inspectiontool', 'google-read-aloud',
  'bingbot', 'duckduckbot', 'slurp',
  // Preview social
  'whatsapp', 'facebookexternalhit', 'facebot',
  'twitterbot', 'slackbot', 'discordbot', 'telegrambot', 'linkedinbot',
];

export default function middleware(request: Request) {
  try {
    const ua = (request.headers.get('user-agent') ?? '').toLowerCase();

    // Regra 1: allowlist tem prioridade absoluta
    if (ALLOWED_BOTS.some(b => ua.includes(b))) {
      return next();
    }

    // Regra 2: UA vazio → PASSA (health checks, CDN prefetch)
    if (!ua.trim()) {
      return next();
    }

    // Regra 3: UA presente e na blocklist → bloqueia
    if (BOT_BLOCKLIST.some(b => ua.includes(b))) {
      return new Response('Acesso negado.', {
        status: 403,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    // Regra 4: qualquer outro UA → passa
    return next();

  } catch {
    // Fail-safe: qualquer erro no middleware deixa o request passar
    return next();
  }
}

export const config = {
  matcher: [
    '/((?!favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|css|js|map)$).*)',
  ],
};
