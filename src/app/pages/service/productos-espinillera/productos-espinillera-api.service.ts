import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@/app/config/app-config.service';
import { CrearProductoEspinilleraRequest, ActualizarProductoEspinilleraRequest, ProductoEspinillera } from './productos-espinillera-api.types';

@Injectable({
    providedIn: 'root'
})
export class ProductosEspinilleraApiService {
    private readonly http = inject(HttpClient);
    private readonly configService = inject(AppConfigService);

    private get baseUrl() {
        return `${this.configService.getApiBase()}/productos/espinillera`;
    }

    getProductosEspinillera(): Observable<ProductoEspinillera[]> {
        return this.http.get<ProductoEspinillera[]>(this.baseUrl);
    }

    getProductoEspinillera(id: string): Observable<ProductoEspinillera> {
        return this.http.get<ProductoEspinillera>(`${this.baseUrl}/${id}`);
    }

    crearProductoEspinillera(payload: CrearProductoEspinilleraRequest): Observable<ProductoEspinillera> {
        return this.http.post<ProductoEspinillera>(this.baseUrl, payload);
    }

    actualizarProductoEspinillera(id: string, payload: ActualizarProductoEspinilleraRequest): Observable<ProductoEspinillera> {
        return this.http.put<ProductoEspinillera>(`${this.baseUrl}/${id}`, payload);
    }

    eliminarProductoEspinillera(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    bulkCreate(payload: any[]): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/bulk`, payload);
    }
}
