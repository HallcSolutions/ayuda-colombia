import { SupplyCategory, UrgencyLevel } from '../constants/app.constants';
import { AidAlert } from '../models/aid-alert.model';
import { alertNeeds } from './needs.util';

const alert = (overrides: Partial<AidAlert> = {}): AidAlert =>
  ({
    title: 'Faltan herramientas',
    message: 'guantes de construcción, gafas de seguridad; cascos.',
    category: SupplyCategory.SHELTER_KIT,
    severity: UrgencyLevel.HIGH,
    ...overrides,
  }) as AidAlert;

describe('alertNeeds', () => {
  it('separa la frase en una necesidad por línea', () => {
    expect(alertNeeds(alert())).toEqual([
      'Guantes de construcción',
      'Gafas de seguridad',
      'Cascos',
    ]);
  });

  it('usa el titular cuando el mensaje no enumera nada', () => {
    expect(alertNeeds(alert({ message: '  ' }))).toEqual([
      'Faltan herramientas',
    ]);
  });
});
