export type BrowserShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

export interface PublicSharePayload {
  title: string;
  url: string;
  imageUrl?: string;
  fileName?: string;
}

const imageFile = async (payload: PublicSharePayload): Promise<File | null> => {
  if (!payload.imageUrl || typeof navigator.canShare !== 'function') return null;
  try {
    const response = await fetch(payload.imageUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    const extension = blob.type === 'image/jpeg' ? 'jpg' : (blob.type.split('/')[1] ?? 'png');
    const file = new File([blob], `${payload.fileName ?? 'redayuda'}.${extension}`, {
      type: blob.type || 'image/png',
    });
    return navigator.canShare({ files: [file] }) ? file : null;
  } catch {
    return null;
  }
};

/**
 * Las apps de historias suelen aceptar imágenes, pero no URLs. Cuando el equipo lo
 * permite se envía foto + texto con el enlace al final; si no, se comparte la URL.
 */
export const sharePublicLink = async (payload: PublicSharePayload): Promise<BrowserShareResult> => {
  if (typeof navigator.share === 'function') {
    const file = await imageFile(payload);
    if (file) {
      try {
        await navigator.share({
          title: payload.title,
          text: `${payload.title}\n${payload.url}`,
          files: [file],
        });
        return 'shared';
      } catch (error) {
        if ((error as { name?: string } | null)?.name === 'AbortError') return 'cancelled';
      }
    }

    try {
      await navigator.share({ title: payload.title, url: payload.url });
      return 'shared';
    } catch (error) {
      if ((error as { name?: string } | null)?.name === 'AbortError') return 'cancelled';
    }
  }

  try {
    await navigator.clipboard.writeText(payload.url);
    return 'copied';
  } catch {
    return 'failed';
  }
};
