export type NewsStatus = "published" | "draft" | "archived";

export interface NewsCategory {
  id: string;
  name: string;
  nameKh?: string;
}

export interface News {
  id: string;
  title: string;
  titleKh?: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  photoPath?: string;
  category?: NewsCategory;
  tags?: string[];
  status: NewsStatus;
  authorId: string;
  authorName: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
}

export interface NewsPagination {
  data: News[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
