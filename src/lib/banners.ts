import { Banner } from "@/types/banner";

const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL;
const API_DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
};

export const BANNERS_PAGE_SIZE = 15;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const postApi = async (
  path: string,
  body: Record<string, unknown>,
  cacheTag: string,
) => {
  if (!API_BASE_URL) {
    return null;
  }

  const url = new URL(path, API_BASE_URL);
  const response = await fetch(url.toString(), {
    method: "POST",
    next: { revalidate: 60, tags: [cacheTag] },
    headers: API_DEFAULT_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as unknown;
};

const mapApiBanner = (item: Record<string, unknown>): Banner => {
  const id = String(item.id ?? item._id ?? "");
  const title = String(item.title ?? item.name ?? "Unknown");
  const photoPath = item.image ?? item.imageUrl ?? item.photo_path ?? item.photoPath;
  const resolveImageUrl = (path: unknown): string | undefined => {
    if (typeof path !== "string" || !path) return undefined;
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
    const base = "https://meanchey.org/storage/";
    return base.endsWith("/") && path.startsWith("/")
      ? base + path.substring(1)
      : base.endsWith("/") || path.startsWith("/")
      ? base + path
      : base + "/" + path;
  };

  return {
    id,
    title,
    type: typeof item.type === "string" ? item.type : undefined,
    link: typeof item.link === "string" ? item.link : typeof item.url === "string" ? item.url : undefined,
    isActive: typeof item.is_active === "boolean" ? item.is_active : typeof item.isActive === "boolean" ? item.isActive : undefined,
    imageUrl: resolveImageUrl(photoPath),
    createdAt: String(item.createdAt ?? item.created_at ?? new Date().toISOString()),
    updatedAt: String(item.updatedAt ?? item.updated_at ?? new Date().toISOString()),
  };
};

const extractBannerArray = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  }

  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const root = payload as Record<string, unknown>;
  const dataRoot = typeof root.data === "object" && root.data !== null ? (root.data as Record<string, unknown>) : undefined;

  const candidates = [
    dataRoot?.list,
    dataRoot?.items,
    dataRoot?.banners,
    dataRoot?.results,
    root.data,
    root.items,
    root.banners,
    root.results,
    root.list,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
    }
  }

  return [];
};

const extractTotal = (payload: unknown): number => {
  if (!isRecord(payload)) return 0;
  const data = isRecord(payload.data) ? payload.data : payload;
  const raw = data.totalResults ?? data.total_results ?? data.totalRecord ?? data.total;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const sortByNewest = (banners: Banner[]): Banner[] =>
  [...banners].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export type BannerPage = {
  data: Banner[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export const getBanners = async (
  page = 1,
  pageSize = BANNERS_PAGE_SIZE,
  loginToken?: string,
): Promise<BannerPage> => {
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * pageSize;

  if (!API_BASE_URL) {
    return emptyPage(safePage, pageSize);
  }

  try {
    const payload = await postApi(
      "/banner/list",
      { limit: pageSize, offset, ...(loginToken ? { login_token: loginToken } : {}) },
      "banners:list",
    );
    if (!payload) {
      return emptyPage(safePage, pageSize);
    }

    const data = sortByNewest(extractBannerArray(payload).map(mapApiBanner));
    const total = extractTotal(payload);
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : safePage + (data.length === pageSize ? 1 : 0);
    const hasNext = total > 0 ? safePage < totalPages : data.length === pageSize;
    const hasPrev = safePage > 1;

    return {
      data,
      total,
      page: safePage,
      pageSize,
      totalPages,
      hasNext,
      hasPrev,
    };
  } catch {
    return emptyPage(safePage, pageSize);
  }
};

export const searchBanners = async (
  text: string,
  page = 1,
  pageSize = BANNERS_PAGE_SIZE,
  loginToken?: string,
): Promise<BannerPage> => {
  const trimmed = text.trim();
  if (!trimmed) {
    return getBanners(page, pageSize, loginToken);
  }

  if (!API_BASE_URL) {
    return emptyPage(page, pageSize);
  }

  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * pageSize;

  try {
    const payload = await postApi(
      "/banner/list", // or whatever search endpoint
      { text: trimmed, limit: pageSize, offset, ...(loginToken ? { login_token: loginToken } : {}) },
      "banners:search",
    );
    if (!payload) {
      return emptyPage(safePage, pageSize);
    }

    const data = sortByNewest(extractBannerArray(payload).map(mapApiBanner));
    const total = extractTotal(payload);
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : safePage + (data.length === pageSize ? 1 : 0);
    const hasNext = total > 0 ? safePage < totalPages : data.length === pageSize;
    const hasPrev = safePage > 1;

    return {
      data,
      total,
      page: safePage,
      pageSize,
      totalPages,
      hasNext,
      hasPrev,
    };
  } catch {
    return emptyPage(safePage, pageSize);
  }
};

const emptyPage = (page: number, pageSize: number): BannerPage => ({
  data: [],
  total: 0,
  page,
  pageSize,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
});
