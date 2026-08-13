/**
 * Un icono por necesidad. Quien abre el directorio en mitad de una emergencia
 * reconoce "agua" o "pañales" de un vistazo, sin leer la lista completa.
 *
 * Los patrones cubren español e inglés porque el texto lo escribe libremente
 * quien reporta la alerta, no un catálogo cerrado. El primero que coincide gana,
 * así que los términos más específicos van antes que los genéricos.
 */
const NEED_ICONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/pa[ñn]al|beb[eé]|leche|f[oó]rmula|diaper|baby|infant/i, '🍼'],
  [/agua|water|hidrat/i, '💧'],
  [/medic|f[aá]rmac|droga|salud|health|first aid|primeros auxilios/i, '💊'],
  [/aseo|higien|jab[oó]n|toalla|papel|hygiene|soap|towel/i, '🧼'],
  [/colch[oó]n|cobij|cama|sábana|almohada|mattress|blanket|bedding/i, '🛏️'],
  [/ropa|abrigo|zapato|calzado|clothing|clothes|shoes/i, '👕'],
  [/aliment|comida|mercado|arroz|enlatad|food|meal|groceries/i, '🥫'],
  [/mascota|perro|gato|animal|pet/i, '🐾'],
  [/herramient|pala|carpa|tool|shovel|tent/i, '🛠️'],
  [/volunt|brigad|manos|volunteer|help/i, '🤝'],
];

/** Icono para una necesidad; una caja genérica si no encaja en ninguna categoría. */
export function needIcon(need: string): string {
  return NEED_ICONS.find(([pattern]) => pattern.test(need))?.[1] ?? '📦';
}
