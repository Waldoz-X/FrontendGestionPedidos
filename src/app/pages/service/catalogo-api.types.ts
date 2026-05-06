export interface TallaCatalogo {
    id: number;
    etiqueta: string;
    tipoMedida: string;
    segmento: string;
    valorPunto: number;
    ordenDisplay: number;
    activo: boolean;
}

export interface ProductoCatalogo {
    id: string;
    modelo: string;
    division: string;
    idSerieCatalogo: string | null;
    codigoSerie: string;
    idLineaColeccion: string | null;
    codigoLineaColeccion: string;
    idEstado: number;
    codigoEstado: string;
    activo: boolean;
    creadoEn: string;
    actualizadoEn: string;
}

export interface EstiloCatalogo {
    id: string;
    idProducto: string;
    modeloProducto: string;
    nombre: string;
    descripcion: string;
    urlImagenReferencia: string;
    creadoEn: string;
    actualizadoEn: string;
}

export interface GetProductosCatalogoQuery {
    activo?: boolean;
    division?: string;
    idSerieCatalogo?: string;
    search?: string;
}

export interface CrearProductoCatalogoRequest {
    modelo: string;
    division: string;
    idSerieCatalogo: string | null;
    idLineaColeccion: string | null;
    gama: string;
    hsCode: string;
    idEstado: number;
    activo: boolean;
}

export type ActualizarProductoCatalogoRequest = CrearProductoCatalogoRequest;

export interface CrearEstiloCatalogoRequest {
    idProducto: string;
    nombre: string;
    descripcion: string;
    urlImagenReferencia: string;
}

export interface ActualizarEstiloCatalogoRequest {
    nombre: string;
    descripcion: string;
    urlImagenReferencia: string;
}

export interface VarianteCatalogo {
    id: string;
    idProducto: string;
    modeloProducto: string;
    idEstilo: string;
    nombreEstilo: string;
    segmento: string;
    codigoCombinacion: string;
    colorNombre: string;
    colorNombreEn: string;
    rangoCorrida: string;
    urlImagen: string;
    itemCode: string;
    codigoBarras: string;
    activo: boolean;
    creadoEn: string;
    actualizadoEn: string;
}

export interface GetVariantesCatalogoQuery {
    idProducto?: string;
    idEstilo?: string;
    activo?: boolean;
}

export interface CrearVarianteCatalogoRequest {
    idProducto: string;
    idEstilo: string;
    segmento: string;
    codigoCombinacion: string;
    colorNombre: string;
    colorNombreEn: string;
    rangoCorrida: string;
    urlImagen: string;
    itemCode: string;
    codigoBarras: string;
    activo: boolean;
}

export interface ActualizarVarianteCatalogoRequest {
    idEstilo: string;
    segmento: string;
    codigoCombinacion: string;
    colorNombre: string;
    colorNombreEn: string;
    rangoCorrida: string;
    urlImagen: string;
    itemCode: string;
    codigoBarras: string;
    activo: boolean;
}

export interface SkuCatalogo {
    id: string;
    idVariante: string;
    idProducto: string;
    modeloProducto: string;
    idTalla: number;
    etiquetaTalla: string;
    segmentoTalla: string;
    activo: boolean;
    stockDisponible: number;
    stockReservado: number;
    stockNeto: number;
    creadoEn: string;
    actualizadoEn: string;
}

export interface GetSkusCatalogoQuery {
    idVariante?: string;
    idProducto?: string;
    activo?: boolean;
    soloConStock?: boolean;
}

export interface CrearSkuCatalogoRequest {
    idVariante: string;
    idTalla: number;
    activo: boolean;
    stockDisponible: number;
    stockReservado: number;
}

export interface ActualizarSkuCatalogoRequest {
    activo: boolean;
    stockDisponible: number;
    stockReservado: number;
}

export interface PoliticaPrecio {
    id: string;
    nombre: string;
    tipo: string;
    prioridad: number;
    factorDescuento: number;
    vigenteDesde: string;
    vigenteHasta: string | null;
    activo: boolean;
    creadoEn: string;
    actualizadoEn: string;
}

export interface GetPoliticasPrecioQuery {
    activo?: boolean;
    tipo?: string;
    vigenteEn?: string;
}

export interface CrearPoliticaPrecioRequest {
    nombre: string;
    tipo: string;
    prioridad: number;
    factorDescuento: number;
    vigenteDesde: string;
    vigenteHasta: string | null;
    activo: boolean;
}

export type ActualizarPoliticaPrecioRequest = CrearPoliticaPrecioRequest;

export interface PrecioCatalogo {
    id: string;
    idSku: string;
    idPolitica: string;
    nombrePolitica: string;
    idCliente: string | null;
    nombreCliente: string | null;
    moneda: string;
    precioNeto: number;
    vigenteDesde: string;
    vigenteHasta: string | null;
    activo: boolean;
    creadoEn: string;
}

export interface GetPreciosQuery {
    idSku?: string;
    idCliente?: string;
    moneda?: string;
    activo?: boolean;
    vigenteEn?: string;
}

export interface CrearPrecioRequest {
    idSku: string;
    idPolitica: string;
    idCliente: string | null;
    moneda: string;
    precioNeto: number;
    vigenteDesde: string;
    vigenteHasta: string | null;
    activo: boolean;
}

export interface ActualizarPrecioRequest {
    idPolitica: string;
    idCliente: string | null;
    moneda: string;
    precioNeto: number;
    vigenteDesde: string;
    vigenteHasta: string | null;
    activo: boolean;
}

export interface LineaColeccion {
    id: string;
    codigo: string;
    nombre: string;
    division: string;
    anio: number;
    activo: boolean;
    creadoEn: string;
    actualizadoEn: string;
}

export interface GetLineasColeccionQuery {
    activo?: boolean;
    division?: string;
}

export interface CrearLineaColeccionRequest {
    codigo: string;
    nombre: string;
    division: string;
    anio: number;
    activo: boolean;
}

export type ActualizarLineaColeccionRequest = CrearLineaColeccionRequest;

export interface Serie {
    id: string;
    codigo: string;
    nombre: string;
    activo: boolean;
    creadoEn: string;
    actualizadoEn: string;
}

export interface GetSeriesQuery {
    activo?: boolean;
}

export interface CrearSerieRequest {
    codigo: string;
    nombre: string;
    activo: boolean;
}

export type ActualizarSerieRequest = CrearSerieRequest;

export interface Gama {
    id: string;
    nombre: string;
    descripcion: string;
    activo: boolean;
    creadoEn: string;
    actualizadoEn: string;
}

export interface GetGamasQuery {
    activo?: boolean;
}

export interface CrearGamaRequest {
    nombre: string;
    descripcion: string;
    activo: boolean;
}

export type ActualizarGamaRequest = CrearGamaRequest;
