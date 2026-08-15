import { PublicNewsCategory, PublicNewsStatus } from '../constants/app.constants';

export interface PublicNewsItem {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  requirements: string[];
  category: PublicNewsCategory;
  department: string;
  municipality: string;
  sourceName: string;
  sourceUrl: string;
  contactInfo: string;
  publishedAt: string;
  validUntil: string | null;
  verifiedAt: string;
  featured: boolean;
  status: PublicNewsStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePublicNewsPayload {
  title: string;
  summary: string;
  steps: string[];
  requirements: string[];
  category: PublicNewsCategory;
  department: string;
  municipality: string;
  sourceName: string;
  sourceUrl: string;
  contactInfo: string;
  publishedAt: string;
  validUntil?: string;
  featured: boolean;
}
