// ─── Response Types ───

export type EstatusPedido = 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado' | 'Cancelado' | 'Confirmado' | 'Facturado' | 'BORRADOR' | 'CONFIRMADO' | 'FACTURADO' | 'ENVIADO' | 'CANCELADO';
export type MonedaPedido = 'USD' | 'MXN';

export interface LineaPedido {
    id: string;
    idSku: string;
    cantidad: number;
    precioUnitario: number;
    descuentoLinea: number;
    subtotal: number;
    clItem?: string;
    nbProducto?: string;
    nbCombinacion?: string;
    nbTalla?: string;
}

export interface Pedido {
    id: string;
    folio: string;
    idCliente: string;
    nombreCliente: string;
    idUsuarioCaptura: string;
    fecha: string;
    estatus: EstatusPedido;
    moneda: MonedaPedido;
    subtotal: number;
    descuentoComercial: number;
    descuentoAdmin: number;
    total: number;
    notas: string;
    lineas: LineaPedido[];
    resumenProductos?: string;
    historial?: HistorialPedido[];
}

export interface HistorialPedido {
    id: string;
    idPedido: string;
    estatusAnterior: EstatusPedido;
    estatusNuevo: EstatusPedido;
    idUsuario: string;
    notas: string;
    registradoEn: string;
    nbUsuario?: string;
}

export interface DashboardResumenDto {
    montoTotalFacturado: number;
    montoPendienteFacturar: number;
    conteosPorEstatus: Partial<Record<EstatusPedido, number>>;
}

export interface CambiarEstatusPedidoRequest {
    estatus: EstatusPedido;
    notas?: string;
}

// ─── Request Types ───

export interface GetPedidosQuery {
    estatus?: string;
    idCliente?: string;
    idEmpleado?: string;
    filtroEstatus?: string;
    filtroCliente?: string;
    filtroEmpleado?: string;
}

export interface CrearLineaPedidoRequest {
    idSku: string;
    cantidad: number;
    precioUnitario: number;
    descuentoLinea: number;
}

export interface CrearPedidoRequest {
    idCliente: string;
    idDireccionEnvio: string;
    idPolitica: string;
    moneda: MonedaPedido;
    notas: string;
    lineas: CrearLineaPedidoRequest[];
}

export interface ActualizarNotasPedidoRequest {
    notas: string;
}

export interface AgregarLineaRequest {
    idSku: string;
    cantidad: number;
    descuentoLinea: number;
}

export interface ActualizarCantidadLineaRequest {
    cantidad: number;
}
