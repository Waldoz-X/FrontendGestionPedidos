import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
        return `${this.configService.getApiBase()}/Inventario`;
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
        let params = new HttpParams();

        if (clTipoMovimiento) {
            params = params.set('clTipoMovimiento', clTipoMovimiento);
        }

        if (feInicio) {
            params = params.set('feInicio', feInicio);
        }

        if (feFin) {
            params = params.set('feFin', feFin);
        }

        return this.http.get<LibroAuditoriaDto[]>(`${this.baseUrl}/libro-auditoria`, { params });
    }

    getStockReal(): Observable<StockRealDto[]> {
        return this.http.get<StockRealDto[]>(`${this.baseUrl}/stock-real`);
    }

    getRotacion(feInicio: string, feFin: string): Observable<RotacionDto[]> {
        const params = new HttpParams()
            .set('feInicio', feInicio)
            .set('feFin', feFin);

        return this.http.get<RotacionDto[]>(`${this.baseUrl}/rotacion`, { params });
    }
}
