import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { FileFilterCallback, memoryStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PHOTO_SIZE_BYTES,
} from '../constants/app.constants';

const uploadDirectory = join(process.cwd(), 'uploads');

type VerifiedImageType = {
  extension: '.jpg' | '.png' | '.webp';
  mimeType: (typeof ALLOWED_IMAGE_TYPES)[number];
};

const startsWith = (buffer: Buffer, signature: number[]): boolean =>
  signature.every((byte, index) => buffer[index] === byte);

/** Detecta el formato por los bytes reales, nunca por nombre o cabecera del cliente. */
export function detectImageType(buffer: Buffer): VerifiedImageType | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { extension: '.jpg', mimeType: 'image/jpeg' };
  }
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { extension: '.png', mimeType: 'image/png' };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { extension: '.webp', mimeType: 'image/webp' };
  }
  return null;
}

/**
 * Multer retiene la foto en memoria. Así una validación fallida nunca deja archivos
 * huérfanos en disco; el servicio solo persiste bytes que ya fueron comprobados.
 */
export const photoUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_PHOTO_SIZE_BYTES },
  fileFilter: (
    _request: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      callback(
        new BadRequestException('Solo se permiten imágenes JPG, PNG o WEBP'),
      );
      return;
    }
    callback(null, true);
  },
};

@Injectable()
export class PhotoStorageService {
  async store(files: Express.Multer.File[]): Promise<string[]> {
    const verified = files.map((file) => {
      if (!file.buffer || file.size > MAX_PHOTO_SIZE_BYTES) {
        throw new BadRequestException('La imagen supera el tamaño permitido');
      }
      const detected = detectImageType(file.buffer);
      if (!detected || detected.mimeType !== file.mimetype) {
        throw new BadRequestException(
          'El contenido del archivo no corresponde a una imagen JPG, PNG o WEBP válida',
        );
      }
      return { detected, file };
    });

    await mkdir(uploadDirectory, { recursive: true });
    const urls: string[] = [];
    try {
      for (const { detected, file } of verified) {
        const filename = `${randomUUID()}${detected.extension}`;
        await writeFile(join(uploadDirectory, filename), file.buffer, {
          flag: 'wx',
        });
        urls.push(`/uploads/${filename}`);
      }
      return urls;
    } catch (error) {
      await this.remove(urls);
      throw error;
    }
  }

  async remove(urls: string[]): Promise<void> {
    await Promise.all(
      urls.map(async (url) => {
        const filename = basename(url);
        if (url !== `/uploads/${filename}`) return;
        try {
          await unlink(join(uploadDirectory, filename));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
      }),
    );
  }
}
