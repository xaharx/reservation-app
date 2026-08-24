// Matches src/prisma/schema.prisma models Banner/About/Gallery/Contact/
// SocialMedia/AppSetting and src/validators/cms-admin.validator.js field by
// field, so forms here can't silently drift from what the API accepts.

export type BannerPlacement = 'HOME_HERO' | 'HOME_PROMOTION' | 'RESERVATION' | 'APP_MODAL';

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  actionLabel: string | null;
  actionUrl: string | null;
  placement: BannerPlacement;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AboutSection = {
  id: string;
  sectionKey: string;
  title: string;
  content: string;
  imageUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GalleryImage = {
  id: string;
  title: string | null;
  altText: string | null;
  imageUrl: string;
  category: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Contact = {
  id: string;
  label: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  openingHours: Record<string, unknown> | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SocialMediaLink = {
  id: string;
  platform: string;
  profileUrl: string;
  iconUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AppSetting = {
  id: string;
  settingKey: string;
  value: unknown;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};
