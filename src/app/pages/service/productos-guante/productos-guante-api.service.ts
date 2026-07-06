import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@/app/config/app-config.service';
import { ProductoGuante, CrearProductoGuanteRequest, ActualizarProductoGuanteRequest } from './productos-guante-api.types';

@Injectable({
    providedIn: 'root'
})
export class ProductosGuanteApiService {
    private readonly http = inject(HttpClient);
    private readonly configService = inject(AppConfigService);

    private get baseUrl() {
        return `${this.configService.getApiBase()}/productos/guantes`;
    }

    getProductosGuantes(): Observable<ProductoGuante[]> {
        return this.http.get<ProductoGuante[]>(this.baseUrl);
    }

    getProductoGuante(id: string): Observable<ProductoGuante> {
        return this.http.get<ProductoGuante>(`${this.baseUrl}/${id}`);
    }

    crearProductoGuante(payload: CrearProductoGuanteRequest): Observable<ProductoGuante> {
        return this.http.post<ProductoGuante>(this.baseUrl, payload);
    }

    actualizarProductoGuante(id: string, payload: ActualizarProductoGuanteRequest): Observable<ProductoGuante> {
        return this.http.put<ProductoGuante>(`${this.baseUrl}/${id}`, payload);
    }

    eliminarProductoGuante(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    crearProductosGuanteBulk(payload: any[]): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/bulk`, payload);
    }
}
