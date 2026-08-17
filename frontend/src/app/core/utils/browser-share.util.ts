export type BrowserShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

export interface PublicSharePayload {
  title: string;
  url: string;
  imageUrl?: string;
  fileName?: string;
}

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No fue posible preparar la imagen para compartir.'));
    image.src = source;
  });

const drawCover = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
): void => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = Math.max(0, (image.naturalWidth - sourceWidth) / 2);
  const sourceY = Math.max(0, (image.naturalHeight - sourceHeight) / 2);
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
};

const wrappedLines = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] => {
  const lines: string[] = [];
  for (const word of text.split(/\s+/)) {
    const current = lines.at(-1);
    if (!current || context.measureText(`${current} ${word}`).width > maxWidth) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${current} ${word}`;
    }
  }
  return lines.slice(0, 4);
};

const canvasBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('No fue posible crear la imagen para compartir.'));
    }, 'image/png');
  });

/**
 * Instagram y Facebook suelen ignorar el texto que acompaña un archivo. Por eso
 * la imagen compartida incluye el nombre del aviso, el dominio y un QR que abre
 * exactamente el registro, incluso cuando la red social conserva solo la foto.
 */
const socialCardBlob = async (payload: PublicSharePayload, source: Blob): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('El navegador no permite preparar la imagen.');

  const photoUrl = URL.createObjectURL(source);
  try {
    const photo = await loadImage(photoUrl);
    context.fillStyle = '#f8f4e9';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawCover(context, photo, canvas.width, 1110);

    const shade = context.createLinearGradient(0, 0, 0, 1110);
    shade.addColorStop(0, 'rgba(7, 36, 27, 0.06)');
    shade.addColorStop(1, 'rgba(7, 36, 27, 0.42)');
    context.fillStyle = shade;
    context.fillRect(0, 0, canvas.width, 1110);

    context.fillStyle = '#ffffff';
    context.font = '800 36px Arial, sans-serif';
    context.fillText('RedAyuda', 72, 90);
    context.fillStyle = '#ff765e';
    context.fillText('Colombia', 72, 132);

    context.fillStyle = '#0d2d23';
    context.font = '800 62px Arial, sans-serif';
    const lines = wrappedLines(context, payload.title, 920);
    lines.forEach((line, index) => context.fillText(line, 72, 1235 + index * 72));

    const { default: QRCode } = await import('qrcode');
    const qrDataUrl = await QRCode.toDataURL(payload.url, {
      width: 280,
      margin: 2,
      color: { dark: '#0d5e47', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
    const qr = await loadImage(qrDataUrl);
    context.fillStyle = '#ffffff';
    context.fillRect(728, 1540, 288, 288);
    context.drawImage(qr, 732, 1544, 280, 280);

    context.fillStyle = '#ef6045';
    context.fillRect(72, 1542, 78, 7);
    context.fillStyle = '#405149';
    context.font = '700 26px Arial, sans-serif';
    context.fillText('INFORMACIÓN Y CONTACTO', 72, 1600);
    context.fillStyle = '#0d5e47';
    context.font = '800 42px Arial, sans-serif';
    context.fillText('redayudacolombia.com', 72, 1660);
    context.fillStyle = '#5c6963';
    context.font = '500 29px Arial, sans-serif';
    context.fillText('Escanea el código para abrir', 72, 1735);
    context.fillText('directamente este aviso.', 72, 1777);

    return await canvasBlob(canvas);
  } finally {
    URL.revokeObjectURL(photoUrl);
  }
};

const imageFile = async (payload: PublicSharePayload): Promise<File | null> => {
  if (!payload.imageUrl || typeof navigator.canShare !== 'function') return null;
  try {
    const response = await fetch(payload.imageUrl);
    if (!response.ok) return null;
    const source = await response.blob();
    const blob = await socialCardBlob(payload, source).catch(() => source);
    const extension = blob.type === 'image/jpeg' ? 'jpg' : 'png';
    const file = new File([blob], `${payload.fileName ?? 'redayuda'}.${extension}`, {
      type: blob.type || 'image/png',
    });
    return navigator.canShare({ files: [file] }) ? file : null;
  } catch {
    return null;
  }
};

/**
 * Las apps de historias suelen aceptar imágenes, pero no URLs. La tarjeta lleva un
 * QR y el enlace exacto se copia para poder pegarlo como sticker; si el dispositivo
 * no comparte archivos, se envía la URL normalmente.
 */
export const sharePublicLink = async (payload: PublicSharePayload): Promise<BrowserShareResult> => {
  if (typeof navigator.share === 'function') {
    let linkCopied = false;
    try {
      await navigator.clipboard.writeText(payload.url);
      linkCopied = true;
    } catch {
      linkCopied = false;
    }

    const file = await imageFile(payload);
    if (file) {
      try {
        await navigator.share({ files: [file] });
        return linkCopied ? 'copied' : 'shared';
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
