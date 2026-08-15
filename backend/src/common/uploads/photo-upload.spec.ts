import { BadRequestException } from '@nestjs/common';
import { detectImageType, PhotoStorageService } from './photo-upload';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

const file = (
  buffer: Buffer,
  mimetype: string,
  originalname = 'foto.png',
): Express.Multer.File =>
  ({
    buffer,
    mimetype,
    originalname,
    size: buffer.length,
  }) as Express.Multer.File;

describe('PhotoStorageService', () => {
  const storage = new PhotoStorageService();
  const createdUrls: string[] = [];

  afterEach(async () => {
    await storage.remove(createdUrls.splice(0));
  });

  it('detecta JPG, PNG y WEBP por su firma real', () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff]))?.mimeType).toBe(
      'image/jpeg',
    );
    expect(detectImageType(png)?.mimeType).toBe('image/png');
    expect(
      detectImageType(Buffer.from('RIFFxxxxWEBP', 'ascii'))?.mimeType,
    ).toBe('image/webp');
    expect(detectImageType(Buffer.from('<html>'))).toBeNull();
  });

  it('rechaza HTML aunque el cliente lo declare como JPEG', async () => {
    await expect(
      storage.store([
        file(Buffer.from('<html><script></script>'), 'image/jpeg'),
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza cuando la cabecera declarada no coincide con los bytes', async () => {
    await expect(
      storage.store([file(png, 'image/jpeg')]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('fuerza la extensión detectada y nunca conserva una extensión HTML', async () => {
    const urls = await storage.store([file(png, 'image/png', 'payload.html')]);
    createdUrls.push(...urls);

    expect(urls).toHaveLength(1);
    expect(urls[0]).toMatch(/^\/uploads\/[a-f0-9-]+\.png$/);
    expect(urls[0]).not.toContain('.html');
  });
});
