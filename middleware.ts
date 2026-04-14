import { next } from '@vercel/functions';

// ─── BLOCKLIST ───────────────────────────────────────────────────────────────
// Scrapers, crawlers, ferramentas de ataque, bots de SEO agressivos,
// clientes automáticos e headless browsers.
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
  // Bots de SEO agressivos (não são motores de busca legítimos)
  'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'petalbot',
  'yandexbot', 'baiduspider', 'rogerbot', 'blexbot', 'exabot',
  'dataprovider', 'linkdexbot', 'spbot', 'seokicks',
  // Headless / automação
  'headlesschrome', 'phantomjs', 'selenium', 'webdriver', 'puppeteer',
  'playwright', 'cypress', 'testcafe', 'nightmare',
];

// ─── ALLOWLIST ────────────────────────────────────────────────────────────────
// Motores de busca legítimos + bots de preview social.
// Têm prioridade absoluta sobre a blocklist.
const ALLOWED_BOTS = [
  // Motores de busca
  'googlebot', 'google-inspectiontool', 'google-read-aloud',
  'bingbot', 'duckduckbot', 'slurp',
  // Preview social (WhatsApp, Facebook, Twitter, Slack, Discord, Telegram, LinkedIn)
  'whatsapp', 'facebookexternalhit', 'facebot',
  'twitterbot', 'slackbot', 'discordbot', 'telegrambot', 'linkedinbot',
];

export default function middleware(request: Request) {
  const ua = (request.headers.get('user-agent') ?? '').toLowerCase();

  // 1. Allowlist tem prioridade absoluta
  if (ALLOWED_BOTS.some(b => ua.includes(b))) {
    return next();
  }

  // 2. UA vazio = bot sem identificação → bloqueia
  if (!ua.trim()) {
    return new Response('Acesso negado.', {
      status: 403,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  // 3. UA na blocklist → bloqueia
  if (BOT_BLOCKLIST.some(b => ua.includes(b))) {
    return new Response('Acesso negado.', {
      status: 403,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  // 4. Qualquer outro → passa
  return next();
}

export const config = {
  // Aplica em tudo EXCETO: assets estáticos, favicon, robots.txt, sitemap.xml
  matcher: [
    '/((?!favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|css|js|map)$).*)',
  ],
};
