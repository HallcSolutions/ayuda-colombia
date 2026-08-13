import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { FileFilterCallback, diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PHOTO_SIZE_BYTES,
} from '../constants/app.constants';

const uploadDirectory = join(process.cwd(), 'uploads');
mkdirSync(uploadDirectory, { recursive: true });

/**
 * Configuración única de multer para los módulos que reciben fotos: mismo destino,
 * mismos tipos permitidos y mismo tamaño máximo en reportes y desapariciones.
 */
export const photoUploadOptions = {
  storage: diskStorage({
    destination: uploadDirectory,
    filename: (
      _request: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void,
    ) =>
      callback(
        null,
        `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
      ),
  }),
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

/** Ruta pública con la que el frontend consulta la foto ya guardada. */
export const photoUrl = (file: Express.Multer.File): string =>
  `/uploads/${file.filename}`;
