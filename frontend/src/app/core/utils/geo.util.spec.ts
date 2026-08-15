import { mapUrlForAddress, streetMapUrlForAddress } from './geo.util';

describe('mapas para direcciones públicas', () => {
  const address = 'Carrera 7 # 12-34, Bogotá, Bogotá D.C., Colombia';

  it('arma indicaciones conservando completa la dirección', () => {
    expect(mapUrlForAddress(address)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=Carrera%207%20%23%2012-34%2C%20Bogot%C3%A1%2C%20Bogot%C3%A1%20D.C.%2C%20Colombia',
    );
  });

  it('arma un mapa incrustable de la cuadra', () => {
    expect(streetMapUrlForAddress(address)).toBe(
      'https://maps.google.com/maps?q=Carrera%207%20%23%2012-34%2C%20Bogot%C3%A1%2C%20Bogot%C3%A1%20D.C.%2C%20Colombia&z=16&output=embed',
    );
  });

  it('descarta espacios accidentales de los extremos', () => {
    expect(mapUrlForAddress(`  ${address}  `)).toBe(mapUrlForAddress(address));
  });
});
