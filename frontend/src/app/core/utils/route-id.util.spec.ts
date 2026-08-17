import { uuidFromRouteParameter } from './route-id.util';

describe('uuidFromRouteParameter', () => {
  const id = 'df431bcc-700c-4404-94ae-e68d85e38677';

  it('conserva un identificador limpio', () => {
    expect(uuidFromRouteParameter(id)).toBe(id);
  });

  it('recupera el identificador cuando una app pega el mensaje compartido al enlace', () => {
    expect(uuidFromRouteParameter(`${id} Ayudemos a encontrar a Perla`)).toBe(id);
  });

  it('rechaza una ruta que no contiene un identificador', () => {
    expect(uuidFromRouteParameter('perla-cali')).toBe('');
  });
});
