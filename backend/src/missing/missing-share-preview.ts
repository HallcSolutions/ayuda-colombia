import { MissingStatus } from '../common/constants/app.constants';
import { MissingRecord } from '../common/interfaces/missing-record.interface';

const UUID_SOURCE =
  '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const MISSING_PATH = new RegExp(
  `^/desaparecidos/(?:[^/]+/)?(${UUID_SOURCE})(?:[^/]*)?/?$`,
  'i',
);

export const missingIdFromSharePath = (path: string): string | null =>
  path.match(MISSING_PATH)?.[1] ?? null;

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const slug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const summary = (record: MissingRecord): string => {
  const description = record.description.replace(/\s+/g, ' ').trim();
  const location = ` Último avistamiento: ${record.lastSeenPlace}.`;
  const combined = `${description}${location}`;
  if (combined.length <= 260) return combined;
  const shortened = combined.slice(0, 257);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > 180 ? lastSpace : 257)}…`;
};

const title = (record: MissingRecord): string => {
  if (record.status === MissingStatus.FOUND)
    return `${record.name} fue encontrado · ${record.municipality}`;
  if (record.status === MissingStatus.SHELTERED)
    return `${record.name} está bajo resguardo · ${record.municipality}`;
  if (record.status === MissingStatus.CLOSED)
    return `Búsqueda cerrada: ${record.name} · ${record.municipality}`;
  return `Ayudemos a encontrar a ${record.name} · ${record.municipality}`;
};

const absoluteUrl = (value: string, siteUrl: string): string => {
  try {
    const url = new URL(value, `${siteUrl}/`);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
};

const replaceMeta = (
  html: string,
  attribute: 'name' | 'property',
  key: string,
  value: string,
): string => {
  const pattern = new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, 'i');
  return html.replace(
    pattern,
    `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`,
  );
};

/** Devuelve el mismo SPA, pero con la ficha en el HTML que leen las redes sociales. */
export const renderMissingSharePreview = (
  indexHtml: string,
  record: MissingRecord,
  publicSiteUrl: string,
): string => {
  const siteUrl = publicSiteUrl.replace(/\/+$/, '');
  const version = Date.parse(record.updatedAt) || record.updatedAt;
  const path = `/desaparecidos/${slug(`${record.name}-${record.municipality}`)}/${record.id}`;
  const pageUrl = `${siteUrl}${path}?v=${encodeURIComponent(String(version))}`;
  const imageUrl =
    absoluteUrl(record.photos[0] ?? '', siteUrl) ||
    `${siteUrl}/assets/brand/redayuda-og.jpg`;
  const pageTitle = title(record);
  const pageDescription = summary(record);

  let html = indexHtml
    .replace(
      /<title>[^<]*<\/title>/i,
      `<title>${escapeHtml(pageTitle)} | RedAyuda Colombia</title>`,
    )
    .replace(
      /<link\s+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    )
    .replace(
      /\s*<meta\s+property=["']og:image:(?:type|width|height)["'][^>]*>/gi,
      '',
    );

  html = replaceMeta(html, 'name', 'description', pageDescription);
  html = replaceMeta(html, 'property', 'og:type', 'article');
  html = replaceMeta(html, 'property', 'og:url', pageUrl);
  html = replaceMeta(html, 'property', 'og:title', pageTitle);
  html = replaceMeta(html, 'property', 'og:description', pageDescription);
  html = replaceMeta(html, 'property', 'og:image', imageUrl);
  html = replaceMeta(
    html,
    'property',
    'og:image:alt',
    `Foto de ${record.name}`,
  );
  html = replaceMeta(html, 'name', 'twitter:title', pageTitle);
  html = replaceMeta(html, 'name', 'twitter:description', pageDescription);
  html = replaceMeta(html, 'name', 'twitter:image', imageUrl);
  return html;
};
