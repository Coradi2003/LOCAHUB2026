import { next } from '@vercel/functions';

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  MODO DEBUG — NUNCA BLOQUEIA
// Este arquivo apenas captura o User-Agent real e adiciona headers de
// diagnóstico na resposta. Nenhum request é bloqueado.
// ─────────────────────────────────────────────────────────────────────────────

const BOT_BLOCKLIST = [
  'scrapy', 'crawler', 'spider', 'scraper',
  'wget', 'python-requests', 'python-urllib', 'python-httpx', 'aiohttp',
  'go-http-client', 'okhttp', 'node-fetch', 'got/',
  'phin', 'superagent', 'needle', 'axios/',
  'zgrab', 'masscan', 'nikto', 'sqlmap', 'nuclei',
  'dirbuster', 'gobuster', 'ffuf', 'wfuzz', 'burpsuite',
  'nessus', 'openvas', 'acunetix', 'appscan',
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'petalbot',
  'yandexbot', 'baiduspider', 'rogerbot', 'blexbot', 'exabot',
  'dataprovider', 'linkdexbot', 'spbot', 'seokicks',
  'headlesschrome', 'phantomjs', 'selenium', 'webdriver', 'puppeteer',
  'playwright', 'cypress', 'testcafe', 'nightmare',
];

const ALLOWED_BOTS = [
  'googlebot', 'google-inspectiontool', 'google-read-aloud',
  'bingbot', 'duckduckbot', 'slurp',
  'whatsapp', 'facebookexternalhit', 'facebot',
  'twitterbot', 'slackbot', 'discordbot', 'telegrambot', 'linkedinbot',
];

export default function middleware(request: Request) {
  const ua = request.headers.get('user-agent') ?? '';
  const uaLower = ua.toLowerCase();

  const allowedMatch = ALLOWED_BOTS.find(b => uaLower.includes(b)) ?? 'none';
  const blockedMatch = BOT_BLOCKLIST.find(b => uaLower.includes(b)) ?? 'none';

  // ✅ SEMPRE passa — adiciona só os headers de diagnóstico
  return next({
    headers: {
      'x-debug-ua': ua.slice(0, 250),
      'x-debug-ua-empty': ua.trim() === '' ? 'true' : 'false',
      'x-debug-allowed-match': allowedMatch,
      'x-debug-blocked-match': blockedMatch,
    },
  });
}

export const config = {
  matcher: [
    '/((?!favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|css|js|map)$).*)',
  ],
};
