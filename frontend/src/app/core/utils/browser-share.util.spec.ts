import { sharePublicLink } from './browser-share.util';

describe('sharePublicLink', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null);
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('comparte una imagen para que aparezcan las aplicaciones de historias', async () => {
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: nativeShare });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(new Blob(['imagen'], { type: 'image/png' }), { status: 200 }),
        ),
    );

    await expect(
      sharePublicLink({
        title: 'Perla · Cali',
        url: 'https://redayudacolombia.com/desaparecidos/perla',
        imageUrl: 'https://redayudacolombia.com/uploads/perla.png',
        fileName: 'perla-cali',
      }),
    ).resolves.toBe('shared');

    expect(nativeShare).toHaveBeenCalledWith(
      expect.objectContaining({
        files: [expect.any(File)],
      }),
    );
    expect(nativeShare.mock.calls[0]?.[0]).not.toHaveProperty('url');
    expect(nativeShare.mock.calls[0]?.[0]).not.toHaveProperty('text');
  });

  it('copia el enlace directo antes de abrir una aplicación que solo recibe la imagen', async () => {
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: nativeShare });
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(new Blob(['imagen'], { type: 'image/png' }), { status: 200 }),
        ),
    );

    await expect(
      sharePublicLink({
        title: 'Perla · Cali',
        url: 'https://redayudacolombia.com/desaparecidos/perla',
        imageUrl: 'https://redayudacolombia.com/uploads/perla.png',
      }),
    ).resolves.toBe('copied');

    expect(writeText).toHaveBeenCalledWith('https://redayudacolombia.com/desaparecidos/perla');
    expect(nativeShare).toHaveBeenCalledWith({ files: [expect.any(File)] });
  });
});
