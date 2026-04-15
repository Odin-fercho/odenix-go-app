import { getCurrentTenantSlug, portalFetch } from './portalClient';

/**
 * Registra pedido/cita en el portal antes de abrir WhatsApp (no bloquea si falla).
 */
export async function postTenantInteractionEvent(payload: {
  tipo: 'pedido' | 'cita';
  detalle: string;
  total: number;
}): Promise<void> {
  const slug = getCurrentTenantSlug();
  if (!slug) return;
  try {
    const res = await portalFetch(
      `/api/tenant/events?slug=${encodeURIComponent(slug)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: payload.tipo,
          detalle: payload.detalle,
          total: payload.total,
        }),
      },
    );
    if (!res.ok && __DEV__) {
      console.warn('[Odenix] No se registró el evento:', res.status);
    }
  } catch {
    /* silencioso */
  }
}
