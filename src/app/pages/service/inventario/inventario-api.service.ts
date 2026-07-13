import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '@/app/config/app-config.service';
import { 
    MovimientoInventarioRequest, 
    AjusteInventarioRequest, 
    MovimientoInventarioDto,
    LibroAuditoriaDto,
    StockRealDto,
    RotacionDto
} from './inventario-api.types';

@Injectable({
    providedIn: 'root'
})
export class InventarioApiService {
    private readonly http = inject(HttpClient);
    private readonly configService = inject(AppConfigService);

    private get baseUrl() {
        return `${this.configService.getApiBase()}/inventario`;
    }

    registrarEntrada(payload: MovimientoInventarioRequest): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/entrada`, payload);
    }

    registrarBaja(payload: MovimientoInventarioRequest): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/baja`, payload);
    }

    registrarAjuste(payload: AjusteInventarioRequest): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/ajuste`, payload);
    }

    getKardex(idSku: string): Observable<MovimientoInventarioDto[]> {
        return this.http.get<MovimientoInventarioDto[]>(`${this.baseUrl}/kardex/${idSku}`);
    }

    getLibroAuditoria(clTipoMovimiento?: string, feInicio?: string, feFin?: string): Observable<LibroAuditoriaDto[]> {
        let queryParams = [];

        if (clTipoMovimiento) queryParams.push(`clTipoMovimiento=${clTipoMovimiento}`);
        if (feInicio) queryParams.push(`feInicio=${feInicio}`);
        if (feFin) queryParams.push(`feFin=${feFin}`);
        const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

        return this.http.get<LibroAuditoriaDto[]>(`${this.baseUrl}/libro-auditoria${queryString}`);
    }

    getStockReal(): Observable<StockRealDto[]> {
        return this.http.get<StockRealDto[]>(`${this.baseUrl}/stock-real`);
    }

    getRotacion(feInicio: string, feFin: string): Observable<RotacionDto[]> {
        return this.http.get<RotacionDto[]>(`${this.baseUrl}/rotacion?feInicio=${feInicio}&feFin=${feFin}`);
    }
}
