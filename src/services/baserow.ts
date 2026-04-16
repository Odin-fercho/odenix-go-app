import { finalizePublicMediaUrl } from '../config/mediaUrl';
import { parseTenantPlantilla, type TenantPlantilla } from '../lib/tenantPlantilla';
import { ODENIX_PURPLE, ODENIX_PURPLE_DEEP } from '../../theme/brand';
import { getCurrentTenantSlug, portalFetch, type PortalFetchOptions } from './portalClient';

export type Tenant = {
  id: number;
  nombre: string;
  slogan: string;
  colorPrimario: string;
  colorSecundario: string;
  logoUrl: string;
  whatsapp: string;
  plantilla: TenantPlantilla;
};

export type Product = {
  id: number;
  nombre: string;
  descripcionCorta: string;
  precio: number;
  imagenUrl: string;
};

export type Banner = {
  id: number;
  titulo: string;
  subtitulo: string;
  imagenUrl: string;
  ctaTexto: string;
  ctaTipo: 'whatsapp' | 'url' | 'none';
  ctaValor: string;
  orden: number;
  activo: boolean;
};

export type TenantProfile = {
  direccion: string;
  horario: string;
  telefono: string;
  email: string;
  instagram: string;
  latitud: number | null;
  longitud: number | null;
};

/** Sin slug en URL o sin bootstrap: misma experiencia limpia que el simulador (marca Odenix). */
const FALLBACK_TENANT: Tenant = {
  id: 0,
  nombre: 'Odenix',
  slogan: 'Preview limpio Odenix: hero, catálogo y tabs como en el simulador. Añade slug o env para tu marca.',
  colorPrimario: ODENIX_PURPLE,
  colorSecundario: ODENIX_PURPLE_DEEP,
  logoUrl: '',
  whatsapp: '573001234567',
  plantilla: 'catalogo',
};

const EMPTY_PROFILE: TenantProfile = {
  direccion: '',
  horario: '',
  telefono: '',
  email: '',
  instagram: '',
  latitud: null,
  longitud: null,
};

function isTenantPlantilla(v: unknown): v is TenantPlantilla {
  return v === 'catalogo' || v === 'citas';
}

function normalizeTenant(raw: unknown): Tenant {
  if (!raw || typeof raw !== 'object') return FALLBACK_TENANT;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === 'number' ? o.id : FALLBACK_TENANT.id;
  const nombre = typeof o.nombre === 'string' ? o.nombre : FALLBACK_TENANT.nombre;
  const slogan = typeof o.slogan === 'string' ? o.slogan : FALLBACK_TENANT.slogan;
  const colorPrimario =
    typeof o.colorPrimario === 'string' ? o.colorPrimario : FALLBACK_TENANT.colorPrimario;
  const colorSecundario =
    typeof o.colorSecundario === 'string' ? o.colorSecundario : colorPrimario;
  const logoUrl = readDtoImageUrl(o.logoUrl);
  const whatsapp = typeof o.whatsapp === 'string' ? o.whatsapp : FALLBACK_TENANT.whatsapp;
  const plantilla = isTenantPlantilla(o.plantilla)
    ? o.plantilla
    : parseTenantPlantilla(String(o.plantilla ?? ''));
  return { id, nombre, slogan, colorPrimario, colorSecundario, logoUrl, whatsapp, plantilla };
}

function readDtoImageUrl(raw: unknown): string {
  let u = '';
  if (typeof raw === 'string') u = raw.trim();
  else if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (first && typeof first === 'object' && 'url' in first) {
      const v = (first as { url: unknown }).url;
      u = typeof v === 'string' ? v.trim() : '';
    }
  }
  return finalizePublicMediaUrl(u);
}

function normalizeProduct(raw: unknown): Product | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === 'number' ? o.id : 0;
  const nombre = typeof o.nombre === 'string' ? o.nombre : 'Producto';
  const descripcionCorta =
    typeof o.descripcionCorta === 'string' ? o.descripcionCorta : 'Sin descripción disponible.';
  const precio = typeof o.precio === 'number' ? o.precio : Number.parseFloat(String(o.precio ?? 0));
  const imagenUrl = readDtoImageUrl(o.imagenUrl);
  return {
    id,
    nombre,
    descripcionCorta,
    precio: Number.isFinite(precio) ? precio : 0,
    imagenUrl,
  };
}

function normalizeBanner(raw: unknown): Banner | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const ctaRaw = typeof o.ctaTipo === 'string' ? o.ctaTipo.toLowerCase() : 'none';
  const ctaTipo = ctaRaw === 'whatsapp' || ctaRaw === 'url' ? ctaRaw : 'none';
  return {
    id: typeof o.id === 'number' ? o.id : 0,
    titulo: typeof o.titulo === 'string' ? o.titulo : '',
    subtitulo: typeof o.subtitulo === 'string' ? o.subtitulo : '',
    imagenUrl: readDtoImageUrl(o.imagenUrl),
    ctaTexto: typeof o.ctaTexto === 'string' ? o.ctaTexto : 'Ver más',
    ctaTipo,
    ctaValor: typeof o.ctaValor === 'string' ? o.ctaValor : '',
    orden: typeof o.orden === 'number' ? o.orden : 0,
    activo: typeof o.activo === 'boolean' ? o.activo : true,
  };
}

export type TenantDataOptions = Pick<PortalFetchOptions, 'authToken'>;

export async function getTenantData(options: TenantDataOptions = {}): Promise<Tenant> {
  const slug = getCurrentTenantSlug();
  if (!slug) {
    return FALLBACK_TENANT;
  }
  try {
    const res = await portalFetch(
      `/api/tenant/bootstrap?slug=${encodeURIComponent(slug)}`,
      { authToken: options.authToken },
    );
    if (!res.ok) return FALLBACK_TENANT;
    const data = (await res.json()) as { tenant?: unknown };
    return normalizeTenant(data.tenant);
  } catch {
    return FALLBACK_TENANT;
  }
}

export type CatalogOptions = Pick<PortalFetchOptions, 'authToken'>;

export async function getProductsByTenant(
  tenantId: number,
  options: CatalogOptions = {},
): Promise<Product[]> {
  const slug = getCurrentTenantSlug();
  if (!slug || tenantId <= 0) {
    return [];
  }
  try {
    const res = await portalFetch(
      `/api/tenant/catalog?slug=${encodeURIComponent(slug)}`,
      { authToken: options.authToken },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: unknown[] };
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map(normalizeProduct).filter((p): p is Product => p !== null);
  } catch {
    return [];
  }
}

export type BannersOptions = Pick<PortalFetchOptions, 'authToken'>;

export async function getBannersByTenant(
  tenantId: number,
  options: BannersOptions = {},
): Promise<Banner[]> {
  const slug = getCurrentTenantSlug();
  if (!slug || tenantId <= 0) {
    return [];
  }
  try {
    const res = await portalFetch(
      `/api/tenant/banners?slug=${encodeURIComponent(slug)}`,
      { authToken: options.authToken },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: unknown[] };
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map(normalizeBanner).filter((b): b is Banner => b !== null);
  } catch {
    return [];
  }
}

export async function getTenantProfileBySlug(
  options: Pick<PortalFetchOptions, 'authToken'> = {},
): Promise<TenantProfile> {
  const slug = getCurrentTenantSlug();
  if (!slug) {
    return EMPTY_PROFILE;
  }
  try {
    const res = await portalFetch(
      `/api/tenant/profile?slug=${encodeURIComponent(slug)}`,
      { authToken: options.authToken },
    );
    if (!res.ok) return EMPTY_PROFILE;
    const data = (await res.json()) as { profile?: unknown };
    const p = data.profile;
    if (!p || typeof p !== 'object') return EMPTY_PROFILE;
    const o = p as Record<string, unknown>;
    return {
      direccion: typeof o.direccion === 'string' ? o.direccion : '',
      horario: typeof o.horario === 'string' ? o.horario : '',
      telefono: typeof o.telefono === 'string' ? o.telefono : '',
      email: typeof o.email === 'string' ? o.email : '',
      instagram: typeof o.instagram === 'string' ? o.instagram : '',
      latitud: typeof o.latitud === 'number' ? o.latitud : null,
      longitud: typeof o.longitud === 'number' ? o.longitud : null,
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

export const fallbackTenant = FALLBACK_TENANT;
