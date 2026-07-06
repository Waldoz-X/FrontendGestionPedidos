import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../config/app-config.service';
import {
  CloudinaryFolder,
  CloudinaryResource,
  CloudinaryUploadResponse,
  CloudinaryStats
} from './cloudinary-api.types';

/**
 * Servicio para gestionar operaciones con Cloudinary a través del backend.
 * Todos los endpoints requieren autenticación JWT.
 */
@Injectable({ providedIn: 'root' })
export class CloudinaryApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);
  private apiUrl: string;

  constructor() {
    this.apiUrl = `${this.appConfig.getApiBase()}/Cloudinary`;
  }

  /**
   * Obtiene lista de carpetas disponibles en Cloudinary
   */
  listFolders(): Observable<CloudinaryFolder[]> {
    return this.http.get<CloudinaryFolder[]>(`${this.apiUrl}/folders`);
  }

  /**
   * Lista recursos (imágenes) dentro de una carpeta
   * @param prefix Ruta de la carpeta (ej: "productos/2024")
   */
  listResources(prefix?: string): Observable<CloudinaryResource[]> {
    let params = new HttpParams();
    if (prefix) {
      params = params.set('prefix', prefix);
    }
    return this.http.get<CloudinaryResource[]>(`${this.apiUrl}/resources`, { params });
  }

  /**
   * Sube una imagen a Cloudinary
   * @param file Archivo a subir
   * @param folder Carpeta destino en Cloudinary
   * @param tags Tags opcionales para clasificar la imagen
   */
  uploadImage(
    file: File,
    folder: string,
    tags?: string[]
  ): Observable<CloudinaryUploadResponse> {
    const formData = new FormData();

    formData.append('File', file);

    formData.append('Folder', folder);

    if (tags && tags.length > 0) {
      formData.append('Tags', tags.join(','));
    }

    return this.http.post<CloudinaryUploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Elimina un recurso de Cloudinary
   * @param publicId ID público del recurso (ej: "producto-guante/image_gu9z1f")
   */
  deleteResource(publicId: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.apiUrl}/resources/${encodeURIComponent(publicId)}`
    );
  }

  /**
   * Obtiene estadísticas de una carpeta (cantidad de archivos, tamaño total)
   * @param folder Ruta de la carpeta
   */
  getFolderStats(folder: string): Observable<CloudinaryStats> {
    return this.http.get<CloudinaryStats>(
      `${this.apiUrl}/folders/${encodeURIComponent(folder)}/stats`
    );
  }

  /**
   * Crea una nueva carpeta en Cloudinary
   * @param folder Nombre o ruta de la carpeta a crear
   */
  createFolder(folder: string): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(
      `${this.apiUrl}/folders`,
      { folder }
    );
  }

  /**
   * Elimina una carpeta de Cloudinary
   * @param folder Nombre o ruta de la carpeta a eliminar
   */
  deleteFolder(folder: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.apiUrl}/folders/${encodeURIComponent(folder)}`
    );
  }
}

