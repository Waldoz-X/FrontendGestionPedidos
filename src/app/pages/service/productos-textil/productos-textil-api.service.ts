import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@/app/config/app-config.service';
import { ProductoTextil, CrearProductoTextilRequest, ActualizarProductoTextilRequest } from './productos-textil-api.types';

@Injectable({
    providedIn: 'root'
})
export class ProductosTextilApiService {
    private readonly http = inject(HttpClient);
    private readonly configService = inject(AppConfigService);

    private get baseUrl() {
        return `${this.configService.getApiBase()}/productos/textil`;
    }

    getProductosTextil(): Observable<ProductoTextil[]> {
        return this.http.get<ProductoTextil[]>(this.baseUrl);
    }

    getProductoTextil(id: string): Observable<ProductoTextil> {
        return this.http.get<ProductoTextil>(`${this.baseUrl}/${id}`);
    }

    crearProductoTextil(payload: CrearProductoTextilRequest): Observable<ProductoTextil> {
        return this.http.post<ProductoTextil>(this.baseUrl, payload);
    }

    actualizarProductoTextil(id: string, payload: ActualizarProductoTextilRequest): Observable<ProductoTextil> {
        return this.http.put<ProductoTextil>(`${this.baseUrl}/${id}`, payload);
    }

    eliminarProductoTextil(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    // Bulk endpoint
    crearProductosTextilBulk(payload: any[]): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/bulk`, payload);
    }
}
