import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AppConfigService } from '../../config/app-config.service';
import {
    ActualizarAreaRequest,
    ActualizarEstadoRequest,
    ActualizarPaisRequest,
    Area,
    CrearAreaRequest,
    CrearEstadoRequest,
    CrearPaisRequest,
    Estado,
    Pais
} from './catalogos-maestros-api.types';

@Injectable({ providedIn: 'root' })
export class CatalogosMaestrosService {
    private readonly http = inject(HttpClient);
    private readonly appConfig = inject(AppConfigService);

    private get baseUrl(): string {
        return this.appConfig.getCatalogosBase();
    }

    // ─── COUNTRIES ───

    getPaises(activo?: boolean): Observable<Pais[]> {
        let params = new HttpParams();

        if (activo !== undefined) {
            params = params.set('activo', String(activo));
        }

        return this.http.get<Pais[]>(`${this.baseUrl}/paises`, { params });
    }

    crearPais(payload: CrearPaisRequest): Observable<Pais> {
        return this.http.post<Pais>(`${this.baseUrl}/paises`, payload);
    }

    actualizarPais(id: number, payload: ActualizarPaisRequest): Observable<Pais> {
        return this.http.put<Pais>(`${this.baseUrl}/paises/${id}`, payload);
    }

    eliminarPais(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/paises/${id}`);
    }

    // ─── AREAS ───

    getAreas(activo?: boolean): Observable<Area[]> {
        return this.http.get<unknown[]>(`${this.baseUrl}/AREAS_DEPARTAMENTOS`).pipe(
            map((items) => this.normalizeAreas(items, activo))
        );
    }

    crearArea(payload: CrearAreaRequest): Observable<Area> {
        return this.http.post<Area>(`${this.baseUrl}/areas`, payload);
    }

    actualizarArea(id: number, payload: ActualizarAreaRequest): Observable<Area> {
        return this.http.put<Area>(`${this.baseUrl}/areas/${id}`, payload);
    }

    eliminarArea(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/areas/${id}`);
    }

    // ─── ESTADOS ───

    getEstados(idPais?: number, activo?: boolean): Observable<Estado[]> {
        let params = new HttpParams();

        if (idPais !== undefined) {
            params = params.set('idPais', String(idPais));
        }

        if (activo !== undefined) {
            params = params.set('activo', String(activo));
        }

        return this.http.get<Estado[]>(`${this.baseUrl}/estados`, { params });
    }

    crearEstado(payload: CrearEstadoRequest): Observable<Estado> {
        return this.http.post<Estado>(`${this.baseUrl}/estados`, payload);
    }

    actualizarEstado(id: number, payload: ActualizarEstadoRequest): Observable<Estado> {
        return this.http.put<Estado>(`${this.baseUrl}/estados/${id}`, payload);
    }

    eliminarEstado(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/estados/${id}`);
    }

    private normalizeAreas(items: unknown[], activo?: boolean): Area[] {
        return (items ?? [])
            .map((item) => this.toArea(item))
            .filter((item): item is Area => item !== null)
            .filter((item) => (activo === undefined ? true : item.activo === activo));
    }

    private toArea(raw: unknown): Area | null {
        if (!raw || typeof raw !== 'object') {
            return null;
        }

        const item = raw as Record<string, unknown>;

        const id = this.toNumber(item['id']) ?? this.toNumber(item['idCatalogoElemento']) ?? 0;

        const nombre = this.toString(item['nombre'])
            ?? this.toString(item['nbCatalogoElemento'])
            ?? this.toString(item['nbCatalogo'])
            ?? this.toString(item['clCatalogoElemento'])
            ?? '';

        if (!nombre.trim()) {
            return null;
        }

        const estatusCatalogoElemento = this.toString(item['clEstatusCatalogoElemento']);
        const estatus = this.toString(item['clEstatus']);
        const activoPorEstatusCatalogoElemento = estatusCatalogoElemento ? estatusCatalogoElemento.toUpperCase() === 'ACTIVO' : null;
        const activoPorEstatus = estatus ? estatus.toUpperCase() === 'ACTIVO' : null;

        const activo = this.toBoolean(item['activo'])
            ?? this.toBoolean(item['esActivo'])
            ?? activoPorEstatusCatalogoElemento
            ?? activoPorEstatus
            ?? true;

        return { id, nombre, activo };
    }

    private toString(value: unknown): string | null {
        return typeof value === 'string' ? value : null;
    }

    private toNumber(value: unknown): number | null {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const parsed = Number(value);

            return Number.isFinite(parsed) ? parsed : null;
        }

        return null;
    }

    private toBoolean(value: unknown): boolean | null {
        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();

            if (normalized === 'true' || normalized === '1' || normalized === 'activo') {
                return true;
            }

            if (normalized === 'false' || normalized === '0' || normalized === 'inactivo') {
                return false;
            }
        }

        return null;
    }
}
