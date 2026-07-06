import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@/app/config/app-config.service';
import { CrearProductoFitnessRequest, ActualizarProductoFitnessRequest, ProductoFitness } from './productos-fitness-api.types';

@Injectable({
    providedIn: 'root'
})
export class ProductosFitnessApiService {
    private readonly http = inject(HttpClient);
    private readonly configService = inject(AppConfigService);

    private get baseUrl() {
        return `${this.configService.getApiBase()}/productos/fitness`;
    }

    getProductosFitness(): Observable<ProductoFitness[]> {
        return this.http.get<ProductoFitness[]>(this.baseUrl);
    }

    getProductoFitness(id: string): Observable<ProductoFitness> {
        return this.http.get<ProductoFitness>(`${this.baseUrl}/${id}`);
    }

    crearProductoFitness(payload: CrearProductoFitnessRequest): Observable<ProductoFitness> {
        return this.http.post<ProductoFitness>(this.baseUrl, payload);
    }

    actualizarProductoFitness(id: string, payload: ActualizarProductoFitnessRequest): Observable<ProductoFitness> {
        return this.http.put<ProductoFitness>(`${this.baseUrl}/${id}`, payload);
    }

    eliminarProductoFitness(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    bulkCreate(payload: any[]): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/bulk`, payload);
    }
}
