/**
 * Un correo al que de verdad se pueda escribir: nombre, arroba, dominio y una
 * terminación real. El validador `Validators.email` de Angular da por bueno
 * `juan@correo`, que la API rechaza; entonces el formulario se enviaba y la
 * persona solo veía un error genérico. Quien decide si la dirección existe
 * sigue siendo el servidor de correo.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Largo máximo aceptado; el mismo que guarda la API. */
export const EMAIL_MAX_LENGTH = 160;
