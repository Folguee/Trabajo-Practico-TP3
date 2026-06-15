import { beforeEach, describe, expect, it, vi } from 'vitest';

const getIdToken = vi.fn();

vi.mock('../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken,
    },
  },
}));

describe('Receipt Service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    process.env.EXPO_PUBLIC_RECEIPT_STORAGE_URL =
      'https://example.supabase.co/functions/v1/receipt-storage';
  });

  it('sube la imagen binaria con el token Firebase y devuelve imagePath', async () => {
    getIdToken.mockResolvedValue('firebase-id-token');
    const imageBytes = new Uint8Array([255, 216, 255, 217]).buffer;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(imageBytes, {
          status: 200,
          headers: { 'Content-Type': 'image/jpeg' },
        })
      )
      .mockResolvedValueOnce(
        Response.json(
          { path: 'firebase-user/receipt.jpg' },
          { status: 201 }
        )
      );
    vi.stubGlobal('fetch', fetchMock);

    const { uploadReceipt } = await import('../receipt.service');
    const path = await uploadReceipt({ uri: 'file:///receipt.jpg' });

    expect(path).toBe('firebase-user/receipt.jpg');
    expect(getIdToken).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenNthCalledWith(1, 'file:///receipt.jpg');
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://example.supabase.co/functions/v1/receipt-storage',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer firebase-id-token',
          'Content-Type': 'image/jpeg',
        },
        body: imageBytes,
      })
    );
  });

  it('rechaza imagenes mayores a 5 MB antes de llamar a Supabase', async () => {
    const oversizedImage = new Uint8Array(5 * 1024 * 1024 + 1).buffer;
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(oversizedImage, {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { uploadReceipt } = await import('../receipt.service');

    await expect(
      uploadReceipt({ uri: 'file:///large.jpg' })
    ).rejects.toThrow('menos de 5 MB');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(getIdToken).not.toHaveBeenCalled();
  });
});
