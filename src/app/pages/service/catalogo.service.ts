import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    ActualizarEstiloCatalogoRequest,
    ActualizarPoliticaPrecioRequest,
    ActualizarProductoCatalogoRequest,
    ActualizarPrecioRequest,
    ActualizarSkuCatalogoRequest,
    ActualizarVarianteCatalogoRequest,
    CrearEstiloCatalogoRequest,
    CrearPoliticaPrecioRequest,
    CrearProductoCatalogoRequest,
    CrearPrecioRequest,
    CrearSkuCatalogoRequest,
    CrearVarianteCatalogoRequest,
    EstiloCatalogo,
    GetPoliticasPrecioQuery,
    GetProductosCatalogoQuery,
    GetPreciosQuery,
    GetSkusCatalogoQuery,
    GetVariantesCatalogoQuery,
    PoliticaPrecio,
    PrecioCatalogo,
    ProductoCatalogo,
    SkuCatalogo,
    TallaCatalogo,
    VarianteCatalogo,
    LineaColeccion,
    GetLineasColeccionQuery,
    CrearLineaColeccionRequest,
    ActualizarLineaColeccionRequest,
    Serie,
    GetSeriesQuery,
    CrearSerieRequest,
    ActualizarSerieRequest,
    Gama,
    GetGamasQuery,
    CrearGamaRequest,
    ActualizarGamaRequest
} from './catalogo-api.types';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
    private readonly http = inject(HttpClient);
    private readonly catalogoUrl = '/api/catalogo';
    private readonly catalogosUrl = '/api/catalogos';

    getTallas(activo?: boolean, segmento?: string): Observable<TallaCatalogo[]> {
        let params = new HttpParams();

        if (activo !== undefined) {
            params = params.set('activo', String(activo));
        }

        if (segmento) {
            params = params.set('segmento', segmento);
        }

        return this.http.get<TallaCatalogo[]>(`${this.catalogoUrl}/tallas`, { params });
    }

    getProductos(query?: GetProductosCatalogoQuery): Observable<ProductoCatalogo[]> {
        let params = new HttpParams();

        if (query?.activo !== undefined) {
            params = params.set('activo', String(query.activo));
        }

        if (query?.division) {
            params = params.set('division', query.division);
        }

        if (query?.idSerieCatalogo) {
            params = params.set('idSerieCatalogo', query.idSerieCatalogo);
        }

        if (query?.search) {
            params = params.set('search', query.search);
        }

        return this.http.get<ProductoCatalogo[]>(`${this.catalogoUrl}/productos`, { params });
    }

    getProductoById(id: string): Observable<ProductoCatalogo> {
        return this.http.get<ProductoCatalogo>(`${this.catalogoUrl}/productos/${id}`);
    }

    crearProducto(payload: CrearProductoCatalogoRequest): Observable<ProductoCatalogo> {
        return this.http.post<ProductoCatalogo>(`${this.catalogoUrl}/productos`, payload);
    }

    actualizarProducto(id: string, payload: ActualizarProductoCatalogoRequest): Observable<ProductoCatalogo> {
        return this.http.put<ProductoCatalogo>(`${this.catalogoUrl}/productos/${id}`, payload);
    }

    getEstilosByProducto(idProducto: string): Observable<EstiloCatalogo[]> {
        return this.http.get<EstiloCatalogo[]>(`${this.catalogoUrl}/productos/${idProducto}/estilos`);
    }

    crearEstilo(payload: CrearEstiloCatalogoRequest): Observable<EstiloCatalogo> {
        return this.http.post<EstiloCatalogo>(`${this.catalogoUrl}/estilos`, payload);
    }

    actualizarEstilo(id: string, payload: ActualizarEstiloCatalogoRequest): Observable<EstiloCatalogo> {
        return this.http.put<EstiloCatalogo>(`${this.catalogoUrl}/estilos/${id}`, payload);
    }

    getVariantes(query?: GetVariantesCatalogoQuery): Observable<VarianteCatalogo[]> {
        let params = new HttpParams();

        if (query?.idProducto) {
            params = params.set('idProducto', query.idProducto);
        }

        if (query?.idEstilo) {
            params = params.set('idEstilo', query.idEstilo);
        }

        if (query?.activo !== undefined) {
            params = params.set('activo', String(query.activo));
        }

        return this.http.get<VarianteCatalogo[]>(`${this.catalogoUrl}/variantes`, { params });
    }

    crearVariante(payload: CrearVarianteCatalogoRequest): Observable<VarianteCatalogo> {
        return this.http.post<VarianteCatalogo>(`${this.catalogoUrl}/variantes`, payload);
    }

    actualizarVariante(id: string, payload: ActualizarVarianteCatalogoRequest): Observable<VarianteCatalogo> {
        return this.http.put<VarianteCatalogo>(`${this.catalogoUrl}/variantes/${id}`, payload);
    }

    getSkus(query?: GetSkusCatalogoQuery): Observable<SkuCatalogo[]> {
        let params = new HttpParams();

        if (query?.idVariante) {
            params = params.set('idVariante', query.idVariante);
        }

        if (query?.idProducto) {
            params = params.set('idProducto', query.idProducto);
        }

        if (query?.activo !== undefined) {
            params = params.set('activo', String(query.activo));
        }

        if (query?.soloConStock !== undefined) {
            params = params.set('soloConStock', String(query.soloConStock));
        }

        return this.http.get<SkuCatalogo[]>(`${this.catalogoUrl}/skus`, { params });
    }

    crearSku(payload: CrearSkuCatalogoRequest): Observable<SkuCatalogo> {
        return this.http.post<SkuCatalogo>(`${this.catalogoUrl}/skus`, payload);
    }

    actualizarSku(id: string, payload: ActualizarSkuCatalogoRequest): Observable<SkuCatalogo> {
        return this.http.put<SkuCatalogo>(`${this.catalogoUrl}/skus/${id}`, payload);
    }

    getPoliticas(query?: GetPoliticasPrecioQuery): Observable<PoliticaPrecio[]> {
        let params = new HttpParams();

        if (query?.activo !== undefined) {
            params = params.set('activo', String(query.activo));
        }

        if (query?.tipo) {
            params = params.set('tipo', query.tipo);
        }

        if (query?.vigenteEn) {
            params = params.set('vigenteEn', query.vigenteEn);
        }

        return this.http.get<PoliticaPrecio[]>('/api/precios/politicas', { params });
    }

    crearPolitica(payload: CrearPoliticaPrecioRequest): Observable<PoliticaPrecio> {
        return this.http.post<PoliticaPrecio>('/api/precios/politicas', payload);
    }

    actualizarPolitica(id: string, payload: ActualizarPoliticaPrecioRequest): Observable<PoliticaPrecio> {
        return this.http.put<PoliticaPrecio>(`/api/precios/politicas/${id}`, payload);
    }

    getPrecios(query?: GetPreciosQuery): Observable<PrecioCatalogo[]> {
        let params = new HttpParams();

        if (query?.idSku) {
            params = params.set('idSku', query.idSku);
        }

        if (query?.idCliente) {
            params = params.set('idCliente', query.idCliente);
        }

        if (query?.moneda) {
            params = params.set('moneda', query.moneda);
        }

        if (query?.activo !== undefined) {
            params = params.set('activo', String(query.activo));
        }

        if (query?.vigenteEn) {
            params = params.set('vigenteEn', query.vigenteEn);
        }

        return this.http.get<PrecioCatalogo[]>('/api/precios', { params });
    }

    crearPrecio(payload: CrearPrecioRequest): Observable<PrecioCatalogo> {
        return this.http.post<PrecioCatalogo>('/api/precios', payload);
    }

    actualizarPrecio(id: string, payload: ActualizarPrecioRequest): Observable<PrecioCatalogo> {
        return this.http.put<PrecioCatalogo>(`/api/precios/${id}`, payload);
    }

    getLineasColeccion(query?: GetLineasColeccionQuery): Observable<LineaColeccion[]> {
        let params = new HttpParams();

        if (query?.activo !== undefined) {
            params = params.set('activo', String(query.activo));
        }

        if (query?.division) {
            params = params.set('division', query.division);
        }

        return this.http.get<LineaColeccion[]>(`${this.catalogosUrl}/lineas-coleccion`, { params });
    }

    crearLineaColeccion(payload: CrearLineaColeccionRequest): Observable<LineaColeccion> {
        return this.http.post<LineaColeccion>(`${this.catalogosUrl}/lineas-coleccion`, payload);
    }

    actualizarLineaColeccion(id: string, payload: ActualizarLineaColeccionRequest): Observable<LineaColeccion> {
        return this.http.put<LineaColeccion>(`${this.catalogosUrl}/lineas-coleccion/${id}`, payload);
    }

    getSeries(query?: GetSeriesQuery): Observable<Serie[]> {
        let params = new HttpParams();

        if (query?.activo !== undefined) {
            params = params.set('activo', String(query.activo));
        }

        return this.http.get<Serie[]>(`${this.catalogosUrl}/series`, { params });
    }

    crearSerie(payload: CrearSerieRequest): Observable<Serie> {
        return this.http.post<Serie>(`${this.catalogosUrl}/series`, payload);
    }

    actualizarSerie(id: string, payload: ActualizarSerieRequest): Observable<Serie> {
        return this.http.put<Serie>(`${this.catalogosUrl}/series/${id}`, payload);
    }

    getGamas(query?: GetGamasQuery): Observable<Gama[]> {
        let params = new HttpParams();

        if (query?.activo !== undefined) {
            params = params.set('activo', String(query.activo));
        }

        return this.http.get<Gama[]>(`${this.catalogosUrl}/gamas`, { params });
    }

    getGamaById(id: string): Observable<Gama> {
        return this.http.get<Gama>(`${this.catalogosUrl}/gamas/${id}`);
    }

    crearGama(payload: CrearGamaRequest): Observable<Gama> {
        return this.http.post<Gama>(`${this.catalogosUrl}/gamas`, payload);
    }

    actualizarGama(id: string, payload: ActualizarGamaRequest): Observable<Gama> {
        return this.http.put<Gama>(`${this.catalogosUrl}/gamas/${id}`, payload);
    }

    eliminarGama(id: string): Observable<void> {
        return this.http.delete<void>(`${this.catalogosUrl}/gamas/${id}`);
    }

    activarGama(id: string): Observable<Gama> {
        return this.http.put<Gama>(`${this.catalogosUrl}/gamas/${id}/activar`, {});
    }
}


