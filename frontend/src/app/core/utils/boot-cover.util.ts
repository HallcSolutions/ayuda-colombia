/**
 * La portada de arranque vive en el `index.html` para pintarse antes de descargar Angular,
 * y es la aplicación la que decide cuándo retirarla. Así no hay dos cargas encadenadas ni
 * un instante en el que se vea la página a medio armar.
 */
export function hideBootCover(): void {
  const cover = document.getElementById('boot-loader');
  if (!cover) {
    return;
  }

  // Se quita del documento cuando la transición termina, no a los tantos milisegundos.
  cover.addEventListener('transitionend', () => cover.remove(), { once: true });
  cover.classList.add('is-done');
  document.body.classList.remove('is-booting');
}
