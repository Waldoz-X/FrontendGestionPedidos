import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@/app/config/app-config.service';
import { CrearProductoMochilaRequest, ActualizarProductoMochilaRequest, ProductoMochila } from './productos-mochila-api.types';

@Injectable({
    providedIn: 'root'
})
export class ProductosMochilaApiService {
    private readonly http = inject(HttpClient);
    private readonly configService = inject(AppConfigService);

    private get baseUrl() {
        return `${this.configService.getApiBase()}/productos/mochila`;
    }

    getProductosMochila(): Observable<ProductoMochila[]> {
        return this.http.get<ProductoMochila[]>(this.baseUrl);
    }

    getProductoMochila(id: string): Observable<ProductoMochila> {
        return this.http.get<ProductoMochila>(`${this.baseUrl}/${id}`);
    }

    crearProductoMochila(payload: CrearProductoMochilaRequest): Observable<ProductoMochila> {
        return this.http.post<ProductoMochila>(this.baseUrl, payload);
    }

    actualizarProductoMochila(id: string, payload: ActualizarProductoMochilaRequest): Observable<ProductoMochila> {
        return this.http.put<ProductoMochila>(`${this.baseUrl}/${id}`, payload);
    }

    eliminarProductoMochila(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    bulkCreate(payload: any[]): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/bulk`, payload);
    }
}
