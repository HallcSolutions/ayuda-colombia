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

export const absoluteSocialUrl = (value: string, siteUrl: string): string => {
  try {
    const url = new URL(value, `${siteUrl}/`);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
};

export interface SocialPreview {
  title: string;
  description: string;
  pageUrl: string;
  imageUrl: string;
  imageAlt: string;
  type?: 'article' | 'website';
}

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

/** Devuelve el mismo SPA con la información que leen las redes sociales. */
export const renderSocialPreview = (
  indexHtml: string,
  preview: SocialPreview,
): string => {
  let html = indexHtml
    .replace(
      /<title>[^<]*<\/title>/i,
      `<title>${escapeHtml(preview.title)} | RedAyuda Colombia</title>`,
    )
    .replace(
      /<link\s+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${escapeHtml(preview.pageUrl)}" />`,
    )
    .replace(
      /\s*<meta\s+property=["']og:image:(?:type|width|height)["'][^>]*>/gi,
      '',
    );

  html = replaceMeta(html, 'name', 'description', preview.description);
  html = replaceMeta(html, 'property', 'og:type', preview.type ?? 'website');
  html = replaceMeta(html, 'property', 'og:url', preview.pageUrl);
  html = replaceMeta(html, 'property', 'og:title', preview.title);
  html = replaceMeta(html, 'property', 'og:description', preview.description);
  html = replaceMeta(html, 'property', 'og:image', preview.imageUrl);
  html = replaceMeta(html, 'property', 'og:image:alt', preview.imageAlt);
  html = replaceMeta(html, 'name', 'twitter:title', preview.title);
  html = replaceMeta(html, 'name', 'twitter:description', preview.description);
  html = replaceMeta(html, 'name', 'twitter:image', preview.imageUrl);
  return html;
};

/** Vista previa de una ficha individual de persona o animal. */
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
    absoluteSocialUrl(record.photos[0] ?? '', siteUrl) ||
    `${siteUrl}/assets/brand/redayuda-og.jpg`;

  return renderSocialPreview(indexHtml, {
    title: title(record),
    description: summary(record),
    pageUrl,
    imageUrl,
    imageAlt: `Foto de ${record.name}`,
    type: 'article',
  });
};
