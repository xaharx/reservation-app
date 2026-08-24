// Matches src/prisma/schema.prisma models MenuCategory/MenuItem and
// src/validators/menu-admin.validator.js field by field.

export type MenuCategory = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};
