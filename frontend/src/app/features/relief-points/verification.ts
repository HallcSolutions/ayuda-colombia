import { ReliefPoint } from '../../core/models/relief-point.model';

/**
 * Un sitio cuenta como verificado si alguien firmó el sello (`verifiedBy`) o si la
 * verificación quedó escrita al principio de las notas ("Verificado: 2026-08-13. …"),
 * que es como se cargaron los puntos antes de que el campo existiera. Sin esto,
 * sitios ya comprobados aparecerían como dudosos.
 */
export function isVerifiedPlace(point: ReliefPoint): boolean {
  return !!point.verifiedBy || /^\s*verificad/i.test(point.notes);
}
