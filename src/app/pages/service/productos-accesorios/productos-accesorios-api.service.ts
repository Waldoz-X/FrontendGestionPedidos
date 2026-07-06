import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@/app/config/app-config.service';
import { CrearProductoAccesorioRequest, ActualizarProductoAccesorioRequest, ProductoAccesorio } from './productos-accesorios-api.types';

@Injectable({
    providedIn: 'root'
})
export class ProductosAccesorioApiService {
    private readonly http = inject(HttpClient);
    private readonly configService = inject(AppConfigService);

    private get baseUrl() {
        return `${this.configService.getApiBase()}/productos/accesorios`;
    }

    getProductosAccesorio(): Observable<ProductoAccesorio[]> {
        return this.http.get<ProductoAccesorio[]>(this.baseUrl);
    }

    getProductoAccesorio(id: string): Observable<ProductoAccesorio> {
        return this.http.get<ProductoAccesorio>(`${this.baseUrl}/${id}`);
    }

    crearProductoAccesorio(payload: CrearProductoAccesorioRequest): Observable<ProductoAccesorio> {
        return this.http.post<ProductoAccesorio>(this.baseUrl, payload);
    }

    actualizarProductoAccesorio(id: string, payload: ActualizarProductoAccesorioRequest): Observable<ProductoAccesorio> {
        return this.http.put<ProductoAccesorio>(`${this.baseUrl}/${id}`, payload);
    }

    eliminarProductoAccesorio(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    bulkCreate(payload: any[]): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/bulk`, payload);
    }
}
