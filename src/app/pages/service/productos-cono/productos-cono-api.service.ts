import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@/app/config/app-config.service';
import { CrearProductoConoRequest, ActualizarProductoConoRequest, ProductoCono } from './productos-cono-api.types';

@Injectable({
    providedIn: 'root'
})
export class ProductosConoApiService {
    private readonly http = inject(HttpClient);
    private readonly configService = inject(AppConfigService);

    private get baseUrl() {
        return `${this.configService.getApiBase()}/productos/cono`;
    }

    getProductosCono(): Observable<ProductoCono[]> {
        return this.http.get<ProductoCono[]>(this.baseUrl);
    }

    getProductoCono(id: string): Observable<ProductoCono> {
        return this.http.get<ProductoCono>(`${this.baseUrl}/${id}`);
    }

    crearProductoCono(payload: CrearProductoConoRequest): Observable<ProductoCono> {
        return this.http.post<ProductoCono>(this.baseUrl, payload);
    }

    actualizarProductoCono(id: string, payload: ActualizarProductoConoRequest): Observable<ProductoCono> {
        return this.http.put<ProductoCono>(`${this.baseUrl}/${id}`, payload);
    }

    eliminarProductoCono(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    bulkCreate(payload: any[]): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/bulk`, payload);
    }
}
