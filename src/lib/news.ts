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
    next: { revalidate: 30 },
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
  const tags =
    Array.isArray(item.tags)
      ? item.tags.filter((tag): tag is string => typeof tag === "string")
      : typeof item.tag === "string"
        ? item.tag
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
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
    content:
      typeof item.content === "string"
        ? item.content
        : typeof item.body === "string"
          ? item.body
          : typeof item.description === "string"
            ? item.description
            : "",
    coverImage:
      typeof item.coverImage === "string"
        ? item.coverImage
        : typeof item.thumbnail === "string"
          ? item.thumbnail
          : typeof item.image === "string"
            ? item.image
            : typeof item.photo_path === "string"
              ? item.photo_path
              : undefined,
    photoPath:
      typeof item.photoPath === "string"
        ? item.photoPath
        : typeof item.photo_path === "string"
          ? item.photo_path
          : undefined,
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
      typeof item.viewCount === "number"
        ? item.viewCount
        : typeof item.view_count === "number"
          ? item.view_count
          : typeof item.total_read === "number"
            ? item.total_read
            : undefined,
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

export const statusColors: Record<NewsStatus, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-600",
};
