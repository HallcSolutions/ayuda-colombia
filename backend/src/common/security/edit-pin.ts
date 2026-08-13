import {
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

const PIN_DIGITS = 6;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

export interface EditPin {
  /** Se entrega una sola vez, en la respuesta de creación. */
  pin: string;
  /** Lo único que se guarda: `salt:hash`, nunca el PIN en claro. */
  hash: string;
}

const hashWithSalt = (pin: string, salt: string): string =>
  `${salt}:${scryptSync(pin, salt, KEY_BYTES).toString('hex')}`;

/** PIN de 6 dígitos que solo conoce quien publica: es su llave para editar el aviso. */
export function createEditPin(): EditPin {
  const pin = randomInt(0, 10 ** PIN_DIGITS)
    .toString()
    .padStart(PIN_DIGITS, '0');
  return {
    pin,
    hash: hashWithSalt(pin, randomBytes(SALT_BYTES).toString('hex')),
  };
}

export function matchesEditPin(pin: string, storedHash: string): boolean {
  const [salt] = storedHash.split(':');
  if (!salt || salt === storedHash) return false;
  const candidate = Buffer.from(hashWithSalt(pin, salt));
  const stored = Buffer.from(storedHash);
  return (
    candidate.length === stored.length && timingSafeEqual(candidate, stored)
  );
}
