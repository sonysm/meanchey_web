import { News, NewsStatus } from "@/types/news";

const API_BASE_URL = process.env.MEANCHEY_API_BASE_URL;
const API_DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
};

const postApi = async (path: string, body: Record<string, unknown>) => {
  if (!API_BASE_URL) {
    return null;
  }

  const url = new URL(path, API_BASE_URL);
  const response = await fetch(url.toString(), {
    method: "POST",
    next: { revalidate: 30, tags: ["news:list"] },
    headers: API_DEFAULT_HEADERS,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as unknown;
};

const normalizeNewsStatus = (status: unknown): NewsStatus => {
  if (status === "published" || status === "draft" || status === "archived") {
    return status;
  }
  return "draft";
};

const buildDefaultPhotoBase = (id: string): string => {
  // Fallback base when `photoPath` isn't provided by the API.
  // Article images uploaded/returned by the backend are served under:
  // https://meanchey.org/storage/article/{id}/{image}
  return `https://meanchey.org/storage/article/${id}`;
};

const toAbsoluteImageUrl = (image: string, photoBase: string): string => {
  const normalized = image.trim();
  if (!normalized) {
    return normalized;
  }
  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("data:")
  ) {
    //console.debug("news.toAbsoluteImageUrl: already absolute or data url", { image: normalized });
    return normalized;
  }

  const resolved = `${photoBase.replace(/\/$/, "")}/${normalized.replace(/^\//, "")}`;
  //console.debug("news.toAbsoluteImageUrl: resolved url", { image: normalized, photoBase, resolved });
  return resolved;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const extractFirstImageFromUnknown = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) {
      return null;
    }

    if (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("/")) {
      return text;
    }

    try {
      const parsed = JSON.parse(text) as unknown;
      return extractFirstImageFromUnknown(parsed);
    } catch {
      return null;
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractFirstImageFromUnknown(item);
      if (found) {
        return found;
      }
    }
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  const insert = value.insert;
  if (isRecord(insert) && typeof insert.image === "string" && insert.image.trim().length > 0) {
    return insert.image.trim();
  }

  const imgs = value.imgs;
  if (Array.isArray(imgs)) {
    const first = imgs.find((img): img is string => typeof img === "string" && img.trim().length > 0);
    if (first) {
      return first.trim();
    }
  }

  const candidates = [value.ops, value.detail, value.content, value.data, value.info, value.result];
  for (const candidate of candidates) {
    const found = extractFirstImageFromUnknown(candidate);
    if (found) {
      return found;
    }
  }

  return null;
};

const resolveCoverImage = (
  explicitCover: string | undefined,
  photoPath: string | undefined,
  id: string,
  contentAny: unknown,
): string | undefined => {
  const photoBase = (photoPath && photoPath.trim().length > 0)
    ? photoPath
    : buildDefaultPhotoBase(id);
  //console.debug("news.resolveCoverImage: inputs", { explicitCover, photoPath, id, contentAny });

  if (explicitCover && explicitCover.trim().length > 0) {
    const resolved = toAbsoluteImageUrl(explicitCover, photoBase);
    //console.debug("news.resolveCoverImage: using explicit cover", { explicitCover, resolved });
    return resolved;
  }

  const firstImage = extractFirstImageFromUnknown(contentAny);
  //console.debug("news.resolveCoverImage: extracted firstImage", { firstImage });
  if (!firstImage) {
    return undefined;
  }

  const resolvedFirst = toAbsoluteImageUrl(firstImage, photoBase);
  //console.debug("news.resolveCoverImage: resolved first image", { firstImage, resolvedFirst });
  return resolvedFirst;
};

const mapApiNewsItem = (item: Record<string, unknown>): News => {
  const id = String(item.id ?? item._id ?? "");
  const title = String(item.title ?? "Untitled");
  const slug = String(item.slug ?? item.code ?? id ?? "news-item");
  const categoryRaw =
    (item.category as Record<string, unknown> | undefined) ??
    (item.category_info as Record<string, unknown> | undefined);
  const statusRaw =
    item.status ??
    item.publish_status ??
    item.state ??
    (item.active === true || item.active === 1 ? "published" : undefined);
  const parsePossibleTagValue = (val: unknown): string[] | undefined => {
    if (Array.isArray(val)) {
      return val.filter((t): t is string => typeof t === "string");
    }
    if (typeof val === "string") {
      const text = val.trim();
      if (!text) return undefined;
      // try JSON parse for stringified arrays
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return parsed.filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean);
        }
      } catch {
        // not JSON, fallthrough
      }
      // fallback: comma separated
      return text.split(",").map((t) => t.trim()).filter(Boolean);
    }
    return undefined;
  };

  const tags = parsePossibleTagValue(item.tags) ?? parsePossibleTagValue(item.tag) ?? undefined;

  const content =
    typeof item.content === "string"
      ? item.content
      : typeof item.body === "string"
        ? item.body
        : typeof item.description === "string"
          ? item.description
          : "";

  const photoPath =
    typeof item.photoPath === "string"
      ? item.photoPath
      : typeof item.photo_path === "string"
        ? item.photo_path
        : undefined;
  // The API can return several possible thumbnail keys. Prefer explicit cover
  // fields commonly used by backend: `coverImage`, `thumbnail`, `thumb`,
  // `thumb_url`, `image`. If `photoPath` is provided it will be used as the
  // base for concatenation (photoPath + thumb).
  const explicitCover =
    typeof item.coverImage === "string"
      ? item.coverImage
      : typeof item.thumbnail === "string"
        ? item.thumbnail
        : typeof (item as any).thumb === "string"
          ? (item as any).thumb
          : typeof (item as any).thumb_url === "string"
            ? (item as any).thumb_url
            : typeof item.image === "string"
              ? item.image
              : typeof item.photo_path === "string"
                ? item.photo_path
                : undefined;

  return {
    id,
    title,
    titleKh:
      typeof item.titleKh === "string"
        ? item.titleKh
        : typeof item.title_kh === "string"
          ? item.title_kh
          : undefined,
    slug,
    excerpt:
      typeof item.excerpt === "string"
        ? item.excerpt
        : typeof item.short_description === "string"
          ? item.short_description
          : undefined,
    content,
    coverImage: resolveCoverImage(explicitCover, photoPath, id, item),
    photoPath,
    category: categoryRaw
      ? {
        id: String(categoryRaw.id ?? categoryRaw._id ?? ""),
        name: String(categoryRaw.name ?? categoryRaw.title ?? ""),
        nameKh:
          typeof categoryRaw.nameKh === "string"
            ? categoryRaw.nameKh
            : typeof categoryRaw.name_kh === "string"
              ? categoryRaw.name_kh
              : undefined,
      }
      : undefined,
    tags,
    status: normalizeNewsStatus(statusRaw),
    authorId: String(item.authorId ?? item.user_id ?? item.author_id ?? ""),
    authorName: String(item.authorName ?? item.author ?? item.user_name ?? ""),
    companyId:
      (() => {
        const raw = item.companyId ?? item.company_id ?? item.cid ?? item.comp_id;
        if (raw === undefined || raw === null) {
          return undefined;
        }
        const parsed = String(raw).trim();
        return parsed.length > 0 ? parsed : undefined;
      })(),
    companyName:
      typeof item.companyName === "string"
        ? item.companyName
        : typeof item.company_name === "string"
          ? item.company_name
          : typeof (item.company as Record<string, unknown> | undefined)?.name === "string"
            ? String((item.company as Record<string, unknown>).name)
            : undefined,
    publishedAt:
      typeof item.publishedAt === "string"
        ? item.publishedAt
        : typeof item.published_at === "string"
          ? item.published_at
          : undefined,
    createdAt: String(
      item.createdAt ?? item.created_at ?? item.post_date ?? new Date().toISOString(),
    ),
    updatedAt: String(item.updatedAt ?? item.updated_at ?? new Date().toISOString()),
    viewCount:
      toNumberOrUndefined((item as Record<string, unknown>).total_view) ??
      toNumberOrUndefined(item.view_count) ??
      toNumberOrUndefined(item.viewCount) ??
      toNumberOrUndefined(item.total_read),
  };
};

const extractNewsArray = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    );
  }

  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const root = payload as Record<string, unknown>;
  const dataRoot =
    typeof root.data === "object" && root.data !== null
      ? (root.data as Record<string, unknown>)
      : undefined;
  const candidates = [
    root.data,
    dataRoot?.list,
    dataRoot?.items,
    dataRoot?.news,
    dataRoot?.results,
    dataRoot?.articles,
    root.items,
    root.news,
    root.results,
    root.articles,
    root.list,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      );
    }
  }

  return [];
};

const extractNewsItem = (payload: unknown): Record<string, unknown> | null => {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const root = payload as Record<string, unknown>;
  const dataRoot =
    typeof root.data === "object" && root.data !== null
      ? (root.data as Record<string, unknown>)
      : undefined;
  const candidates = [root.info, dataRoot?.info, root.data];

  for (const candidate of candidates) {
    if (typeof candidate === "object" && candidate !== null && !Array.isArray(candidate)) {
      return candidate as Record<string, unknown>;
    }
  }

  return null;
};

export const getNews = async (limit = 20, offset = 0): Promise<News[]> => {
  if (!API_BASE_URL) {
    return [];
  }

  try {
    const payload = await postApi("/article/list", { limit, offset });
    if (!payload) {
      return [];
    }

    if (process.env.NODE_ENV !== "production") {
      const root = isRecord(payload) ? payload : null;
      const data = root && isRecord(root.data) ? root.data : null;
      const list = data && Array.isArray(data.list) ? data.list : [];

      //console.debug("news-list full payload:\n", JSON.stringify(payload, null, 2));
      //console.debug("news-list array:\n", JSON.stringify(list, null, 2));
    }

    return extractNewsArray(payload).map(mapApiNewsItem);
  } catch {
    return [];
  }
};

export const getRecentNews = async (limit = 5): Promise<News[]> => {
  try {
    const items = await getNews(limit, 0);
    return items.slice(0, limit);
  } catch {
    return [];
  }
};

export const getNewsById = async (id: string): Promise<News | null> => {
  if (!API_BASE_URL) {
    return null;
  }

  try {
    const payload = await postApi("/article/get", { id: Number(id) || id });
    if (!payload) {
      return null;
    }

    const item = extractNewsItem(payload);
    if (!item) {
      return null;
    }

    return mapApiNewsItem(item);
  } catch {
    return null;
  }
};

export const searchNews = async (
  text: string,
  limit = 20,
  offset = 0,
  countryCode = "kh",
): Promise<{ data: News[]; hasMore: boolean; nextOffset: number }> => {
  if (!API_BASE_URL) {
    return { data: [], hasMore: false, nextOffset: offset };
  }

  const normalizedText = text.trim();
  if (!normalizedText) {
    return { data: [], hasMore: false, nextOffset: offset };
  }

  try {
    // Fetch one extra item so the client can paginate reliably.
    const payload = await postApi("/article/search", {
      country_code: countryCode,
      text: normalizedText,
      limit: limit + 1,
      offset,
    });

    if (!payload) {
      return { data: [], hasMore: false, nextOffset: offset };
    }

    const items = extractNewsArray(payload).map(mapApiNewsItem);
    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;

    return {
      data,
      hasMore,
      nextOffset: offset + data.length,
    };
  } catch {
    return { data: [], hasMore: false, nextOffset: offset };
  }
};

export const statusColors: Record<NewsStatus, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-600",
};
