export interface Company {
  id: string;
  userId?: string;
  comCategoryId?: string | number;
  name: string;
  nameKh?: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}
