import { News, NewsStatus } from "@/types/news";

// Mock data — replace with real API calls
export const mockNews: News[] = [
  {
    id: "1",
    title: "Cambodia Economy Shows Strong Growth",
    titleKh: "សេដ្ឋកិច្ចកម្ពុជាបង្ហាញការរីកចម្រើនខ្លាំង",
    slug: "cambodia-economy-strong-growth",
    excerpt: "The Cambodian economy has shown remarkable resilience...",
    content: "<p>Full article content here...</p>",
    coverImage: "https://placehold.co/800x450",
    category: { id: "1", name: "Economy", nameKh: "សេដ្ឋកិច្ច" },
    tags: ["economy", "cambodia", "growth"],
    status: "published",
    authorId: "admin1",
    authorName: "Admin",
    publishedAt: "2026-07-01T08:00:00Z",
    createdAt: "2026-07-01T07:00:00Z",
    updatedAt: "2026-07-01T08:00:00Z",
    viewCount: 1245,
  },
  {
    id: "2",
    title: "New Infrastructure Projects Announced",
    titleKh: "គម្រោងហេដ្ឋារចនាសម្ព័ន្ធថ្មីត្រូវបានប្រកាស",
    slug: "new-infrastructure-projects",
    excerpt: "The government announced several major infrastructure projects...",
    content: "<p>Full article content here...</p>",
    coverImage: "https://placehold.co/800x450",
    category: { id: "2", name: "Politics", nameKh: "នយោបាយ" },
    tags: ["infrastructure", "government"],
    status: "published",
    authorId: "admin1",
    authorName: "Admin",
    publishedAt: "2026-07-02T09:00:00Z",
    createdAt: "2026-07-02T08:00:00Z",
    updatedAt: "2026-07-02T09:00:00Z",
    viewCount: 876,
  },
  {
    id: "3",
    title: "Tourism Season Preview 2026",
    slug: "tourism-season-preview-2026",
    excerpt: "Experts predict a record-breaking tourism season...",
    content: "<p>Full article content here...</p>",
    category: { id: "3", name: "Tourism", nameKh: "ទេសចរណ៍" },
    tags: ["tourism", "travel"],
    status: "draft",
    authorId: "admin1",
    authorName: "Admin",
    createdAt: "2026-07-03T10:00:00Z",
    updatedAt: "2026-07-03T10:00:00Z",
    viewCount: 0,
  },
];

export const getNews = async (): Promise<News[]> => {
  return mockNews;
};

export const getNewsById = async (id: string): Promise<News | null> => {
  return mockNews.find((n) => n.id === id) ?? null;
};

export const statusColors: Record<NewsStatus, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-600",
};
