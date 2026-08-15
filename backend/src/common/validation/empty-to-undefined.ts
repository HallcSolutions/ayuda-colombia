import { TransformFnParams } from 'class-transformer';

/**
 * Un campo opcional que el formulario envía vacío llega como `''` y haría fallar a
 * validadores como `@IsEmail`. Vacío significa "no lo indicó", no "dato inválido".
 */
export const emptyToUndefined = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' && !value.trim() ? undefined : value;
