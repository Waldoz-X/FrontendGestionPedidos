/**
 * Types para la integración con Cloudinary API
 * Estos tipos corresponden con los DTOs del backend .NET
 */

// Recurso de Cloudinary (imagen, archivo)
export interface CloudinaryResource {
  public_id: string;
  resource_type: 'image' | 'video' | 'raw';
  type: 'upload' | 'private' | 'authenticated';
  created_at: string;
  bytes: number;
  width?: number;
  height?: number;
  url: string;
  secure_url: string;
  folder: string;
  tags: string[];
  original_filename?: string;
  format?: string;
}

// Carpeta de Cloudinary
export interface CloudinaryFolder {
  name: string;
  path: string;
  fileCount: number;
  lastModified?: string;
}

// Respuesta de subida
export interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
  api_key: string;
}

// Estadísticas de carpeta
export interface CloudinaryStats {
  folder: string;
  fileCount: number;
  totalSize: number;
  totalSizeFormatted?: string; // "2.5 MB"
}

// Request para listar recursos
export interface ListResourcesRequest {
  prefix?: string; // path/to/folder
  maxResults?: number;
  nextCursor?: string;
}

// Respuesta de listar recursos
export interface ListResourcesResponse {
  resources: CloudinaryResource[];
  next_cursor?: string;
  rate_limit_allowed: number;
  rate_limit_reset_at: string;
  rate_limit_remaining: number;
}

// Respuesta genérica de API de Cloudinary
export interface CloudinaryApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

