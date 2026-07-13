import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
    ActualizarCantidadLineaRequest,
    ActualizarNotasPedidoRequest,
    AgregarLineaRequest,
    CrearPedidoRequest,
    GetPedidosQuery,
    HistorialPedido,
    Pedido,
    DashboardResumenDto,
    CambiarEstatusPedidoRequest
} from './pedidos-api.types';

@Injectable({ providedIn: 'root' })
export class PedidosService {
    private readonly url = '/api/pedidos';
    private readonly http = inject(HttpClient);

    getPedidos(query?: GetPedidosQuery): Observable<Pedido[]> {
        let params = new HttpParams();

        // Soporte para ambos nombres de parámetros (antiguos y nuevos del backend)
        const estatus = query?.filtroEstatus || query?.estatus;

        if (estatus) {
            params = params.set('filtroEstatus', estatus);
        }

        const cliente = query?.filtroCliente || query?.idCliente;

        if (cliente) {
            params = params.set('filtroCliente', cliente);
        }

        const empleado = query?.filtroEmpleado || query?.idEmpleado;

        if (empleado) {
            params = params.set('filtroEmpleado', empleado);
        }

        return this.http.get<any[]>(this.url, { params }).pipe(
            map(list => (list || []).map(p => ({
                id: p.idPedido || p.id,
                folio: p.clFolio || p.folio,
                idCliente: p.idCliente,
                nombreCliente: p.nbCliente || p.nombreCliente,
                idUsuarioCaptura: p.idUsuarioCaptura,
                fecha: p.fePedido || p.feCreacion || p.fecha,
                estatus: p.clEstatusPedido || p.estatus,
                moneda: (p.clMoneda === 'Peso Mexicano' || p.moneda === 'Peso Mexicano') ? 'MXN' : ((p.clMoneda === 'Dolar Estadounidense' || p.clMoneda === 'Dólar' || p.moneda === 'Dolar Estadounidense') ? 'USD' : (p.clMoneda || p.moneda)),
                subtotal: p.mnSubtotal !== undefined ? p.mnSubtotal : p.subtotal,
                descuentoComercial: p.mnDescuentoComercial !== undefined ? p.mnDescuentoComercial : p.descuentoComercial,
                descuentoAdmin: p.descuentoAdmin,
                total: p.mnTotal !== undefined ? p.mnTotal : p.total,
                notas: p.notas,
                lineas: p.lineas,
                resumenProductos: p.resumenProductos
            } as Pedido)))
        );
    }

    getDashboardResumen(): Observable<DashboardResumenDto> {
        return this.http.get<DashboardResumenDto>(`${this.url}/dashboard-resumen`);
    }

    getPedidoById(id: string): Observable<Pedido> {
        return this.http.get<any>(`${this.url}/${id}`).pipe(
            map(p => {
                const lineas = (p.lineas || []).map((l: any) => ({
                    id: l.idLineaPedido || l.id,
                    idSku: l.idSku,
                    clItem: l.clItem,
                    nbProducto: l.nbProducto,
                    nbCombinacion: l.nbCombinacion,
                    nbTalla: l.nbTalla,
                    cantidad: l.noCantidad !== undefined ? l.noCantidad : (l.nuCantidad || l.cantidad),
                    precioUnitario: l.mnPrecioUnitario || l.precioUnitario,
                    descuentoLinea: l.mnDescuentoLinea || l.descuentoLinea,
                    subtotal: l.mnSubtotal !== undefined ? l.mnSubtotal : l.subtotal
                }));

                const calcSubtotal = lineas.reduce((acc: number, l: any) => acc + (l.subtotal || 0), 0);
                const apiSubtotal = p.mnSubtotal !== undefined ? p.mnSubtotal : p.subtotal;
                const subtotal = apiSubtotal || calcSubtotal;
                
                const descuentoComercial = p.mnDescuentoComercial !== undefined ? p.mnDescuentoComercial : p.descuentoComercial;
                const descuentoAdmin = p.mnDescuentoAdmin !== undefined ? p.mnDescuentoAdmin : p.descuentoAdmin;
                
                const calcTotal = subtotal - (descuentoComercial || 0) - (descuentoAdmin || 0);
                const apiTotal = p.mnTotal !== undefined ? p.mnTotal : p.total;
                const total = apiTotal || calcTotal;

                const historial = (p.historial || []).map((h: any) => ({
                    id: h.id,
                    idPedido: h.idPedido,
                    estatusAnterior: h.estatusAnterior,
                    estatusNuevo: h.estatusNuevo,
                    nbUsuario: h.nbUsuario || h.idUsuario,
                    notas: h.notas,
                    registradoEn: h.registradoEn
                }));

                return {
                    id: p.idPedido || p.id,
                    folio: p.clFolio || p.folio,
                    idCliente: p.idCliente,
                    nombreCliente: p.nbCliente || p.nombreCliente,
                    idUsuarioCaptura: p.idUsuarioCaptura,
                    fecha: p.fePedido || p.feCreacion || p.fecha,
                    estatus: p.clEstatusPedido || p.estatus,
                    moneda: (p.clMoneda === 'Peso Mexicano' || p.moneda === 'Peso Mexicano') ? 'MXN' : ((p.clMoneda === 'Dolar Estadounidense' || p.clMoneda === 'Dólar' || p.moneda === 'Dolar Estadounidense') ? 'USD' : (p.clMoneda || p.moneda)),
                    subtotal: subtotal,
                    descuentoComercial: descuentoComercial,
                    descuentoAdmin: descuentoAdmin,
                    total: total,
                    notas: p.notas,
                    lineas: lineas,
                    resumenProductos: p.resumenProductos,
                    historial: historial
                } as Pedido;
            })
        );
    }

    crearPedido(payload: CrearPedidoRequest): Observable<Pedido> {
        return this.http.post<Pedido>(this.url, payload);
    }

    actualizarNotas(id: string, payload: ActualizarNotasPedidoRequest): Observable<Pedido> {
        return this.http.put<Pedido>(`${this.url}/${id}/notas`, payload);
    }

    agregarLinea(id: string, payload: AgregarLineaRequest): Observable<Pedido> {
        return this.http.post<Pedido>(`${this.url}/${id}/lineas`, payload);
    }

    actualizarCantidadLinea(id: string, idLinea: string, payload: ActualizarCantidadLineaRequest): Observable<Pedido> {
        return this.http.put<Pedido>(`${this.url}/${id}/lineas/${idLinea}`, payload);
    }

    eliminarLinea(id: string, idLinea: string): Observable<Pedido> {
        return this.http.delete<Pedido>(`${this.url}/${id}/lineas/${idLinea}`);
    }

    getHistorial(id: string): Observable<HistorialPedido[]> {
        return this.http.get<any[]>(`${this.url}/${id}/historial`).pipe(
            map(list => (list || []).map(h => ({
                id: h.id,
                idPedido: h.idPedido,
                estatusAnterior: h.estatusAnterior,
                estatusNuevo: h.estatusNuevo,
                idUsuario: h.nbUsuario || h.idUsuario,
                notas: h.notas,
                registradoEn: h.registradoEn
            } as HistorialPedido)))
        );
    }

    cambiarEstatus(id: string, payload: CambiarEstatusPedidoRequest): Observable<Pedido> {
        return this.http.post<Pedido>(`${this.url}/${id}/estatus`, payload);
    }
}
