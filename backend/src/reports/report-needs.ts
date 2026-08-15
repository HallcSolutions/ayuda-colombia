const MAX_REPORT_NEEDS = 12;
const MAX_REPORT_NEED_LENGTH = 80;

/**
 * El formulario envía JSON, pero se conserva compatibilidad con clientes antiguos
 * que enviaban texto separado por comas. JSON inválido u objetos nunca se convierten
 * silenciosamente en una necesidad.
 */
function rawNeeds(value: string): unknown[] | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return trimmed.split(',');
}

export function parseReportNeeds(value: string): string[] {
  const items = rawNeeds(value);
  if (
    !items ||
    items.length < 1 ||
    items.length > MAX_REPORT_NEEDS ||
    items.some((item) => typeof item !== 'string')
  ) {
    return [];
  }

  const normalized = (items as string[]).map((item) => item.trim());
  if (
    normalized.some((item) => !item || item.length > MAX_REPORT_NEED_LENGTH)
  ) {
    return [];
  }

  return [...new Set(normalized)];
}

export const hasValidReportNeeds = (value: unknown): value is string =>
  typeof value === 'string' && parseReportNeeds(value).length > 0;
