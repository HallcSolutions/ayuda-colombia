const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

/**
 * Recupera el identificador aunque una aplicación de mensajería haya pegado texto
 * al final del enlace compartido.
 */
export const uuidFromRouteParameter = (value: string | null): string =>
  value?.match(UUID_PATTERN)?.[0] ?? '';
