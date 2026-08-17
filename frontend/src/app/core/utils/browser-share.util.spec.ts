import { sharePublicLink } from './browser-share.util';

describe('sharePublicLink', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
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
        text: expect.stringMatching(/Perla.*\nhttps:\/\//s),
        files: [expect.any(File)],
      }),
    );
  });
});
