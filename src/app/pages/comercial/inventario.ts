import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { InventarioApiService } from '../service/inventario/inventario-api.service';
import { MovimientoInventarioDto } from '../service/inventario/inventario-api.types';
import { ProductosGuanteApiService } from '../service/productos-guante/productos-guante-api.service';
import { ProductoGuante } from '../service/productos-guante/productos-guante-api.types';
import { CatalogosApiService } from '../service/catalogos-api.service';

interface SkuFlatItem {
    idSku: string;
    clItem: string;
    idElemTalla: number;
    tallaName: string;
    colorName: string;
    noStockDisponible: number;
    noStockReservado: number;
}

@Component({
    selector: 'p-inventario',
    standalone: true,
    imports: [
        FormsModule,
        ButtonModule,
        ConfirmDialogModule,
        SelectModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        TooltipModule,
        TableModule,
        DialogModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        TextareaModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Módulo de Control de Inventarios</div>
                        <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                            Consulte existencias, registre movimientos y audite el historial de Kardex por SKU con protección de sobreventa.
                        </p>
                    </div>
                </ng-template>
                <ng-template #end>
                    @if (productoSeleccionadoId()) {
                        <p-button
                            severity="secondary"
                            label="Recargar Existencias"
                            icon="pi pi-refresh"
                            [outlined]="true"
                            (onClick)="onProductoChange()"
                            [loading]="loadingStocks()"
                        />
                    }
                </ng-template>
            </p-toolbar>

            <!-- SELECTOR DE PRODUCTO -->
            <div class="grid grid-cols-12 gap-4 items-end mb-6">
                <div class="col-span-12 md:col-span-6">
                    <label class="block font-bold mb-3">Seleccione un Producto <span class="text-red-500">*</span></label>
                    <p-select
                        [ngModel]="productoSeleccionadoId()"
                        (ngModelChange)="productoSeleccionadoId.set($event); onProductoChange()"
                        [options]="productosGuanteOptions()"
                        optionLabel="label"
                        optionValue="value"
                        [filter]="true"
                        filterBy="label"
                        placeholder="Buscar producto..."
                        fluid
                    />
                </div>
                <div class="col-span-12 md:col-span-6 text-sm text-surface-500 pb-2">
                    @if (productoSeleccionadoId()) {
                        <span>
                            <i class="pi pi-info-circle mr-1"></i> Se listan todas las combinaciones y tallas (SKUs) físicas asociadas a este modelo.
                        </span>
                    }
                </div>
            </div>

            <!-- TABLA DE SKUS Y STOCKS -->
            @if (productoSeleccionadoId()) {
                <p-table
                    [value]="flatSkus()"
                    [loading]="loadingStocks()"
                    [paginator]="true"
                    [rows]="10"
                    [showCurrentPageReport]="true"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} variantes"
                    [rowHover]="true"
                    responsiveLayout="scroll"
                >
                    <ng-template #header>
                        <tr>
                            <th style="min-width: 10rem">Combinación (Color)</th>
                            <th style="min-width: 6rem">Talla</th>
                            <th style="min-width: 12rem">Código SKU / Item</th>
                            <th style="min-width: 10rem">Stock Disponible</th>
                            <th style="min-width: 10rem">Stock Reservado</th>
                            <th style="min-width: 14rem; text-align: center">Acciones</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-sku>
                        <tr>
                            <td class="font-semibold">{{ sku.colorName }}</td>
                            <td>{{ sku.tallaName }}</td>
                            <td class="font-mono text-xs">{{ sku.clItem }}</td>
                            <td>
                                <span 
                                    class="font-bold text-base"
                                    [class.text-green-500]="sku.noStockDisponible > 10"
                                    [class.text-amber-500]="sku.noStockDisponible <= 10 && sku.noStockDisponible > 0"
                                    [class.text-red-500]="sku.noStockDisponible === 0"
                                >
                                    {{ sku.noStockDisponible }}
                                </span>
                            </td>
                            <td class="text-surface-500">{{ sku.noStockReservado }}</td>
                            <td>
                                <div class="flex justify-center gap-2">
                                    <p-button
                                        icon="pi pi-plus"
                                        severity="success"
                                        [rounded]="true"
                                        [outlined]="true"
                                        (onClick)="abrirEntrada(sku)"
                                        pTooltip="Registrar Entrada"
                                    />
                                    <p-button
                                        icon="pi pi-minus"
                                        severity="danger"
                                        [rounded]="true"
                                        [outlined]="true"
                                        (onClick)="abrirBaja(sku)"
                                        pTooltip="Registrar Baja (Merma)"
                                    />
                                    <p-button
                                        icon="pi pi-sliders-h"
                                        severity="warn"
                                        [rounded]="true"
                                        [outlined]="true"
                                        (onClick)="abrirAjuste(sku)"
                                        pTooltip="Ajuste Físico Real"
                                    />
                                    <p-button
                                        icon="pi pi-history"
                                        severity="info"
                                        [rounded]="true"
                                        [outlined]="true"
                                        (onClick)="abrirKardex(sku)"
                                        pTooltip="Ver Kardex (Historial)"
                                    />
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="6" class="text-center py-8 text-surface-500">
                                No se encontraron combinaciones físicas registradas para este producto.
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            } @else {
                <div class="text-center text-surface-500 py-16">
                    <i class="pi pi-warehouse text-5xl mb-4 block"></i>
                    <p class="text-lg">Seleccione un producto para gestionar sus niveles de existencias e historial de movimientos.</p>
                </div>
            }
        </div>

        <!-- ================= DIÁLOGO DE ENTRADA ================= -->
        <p-dialog
            [(visible)]="entradaDialogVisible"
            [style]="{ width: '450px' }"
            header="Registrar Entrada de Inventario"
            [modal]="true"
            [dismissableMask]="true"
            appendTo="body"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4 mt-2">
                    <div class="bg-surface-50 p-3 rounded border border-surface-200 text-xs">
                        <div>SKU: <strong class="font-mono">{{ selectedSku()?.clItem }}</strong></div>
                        <div class="mt-1">Variante: <strong>{{ selectedSku()?.colorName }} - Talla {{ selectedSku()?.tallaName }}</strong></div>
                        <div class="mt-1">Stock Disponible Actual: <strong>{{ selectedSku()?.noStockDisponible }}</strong></div>
                    </div>
                    <div>
                        <label class="block font-bold mb-2">Cantidad a Ingresar <span class="text-red-500">*</span></label>
                        <input
                            type="number"
                            pInputText
                            [ngModel]="formCantidad()"
                            (ngModelChange)="formCantidad.set($event)"
                            min="1"
                            class="w-full"
                        />
                    </div>
                    <div>
                        <label class="block font-bold mb-2">Motivo de la Entrada <span class="text-red-500">*</span></label>
                        <textarea
                            pTextarea
                            [ngModel]="formMotivo()"
                            (ngModelChange)="formMotivo.set($event)"
                            rows="3"
                            placeholder="Ej. Compra de stock, devolución de cliente..."
                            fluid
                        ></textarea>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="entradaDialogVisible.set(false)" />
                    <p-button label="Registrar Entrada" icon="pi pi-check" severity="success" [loading]="savingMovimiento()" (onClick)="guardarEntrada()" />
                </div>
            </ng-template>
        </p-dialog>

        <!-- ================= DIÁLOGO DE BAJA ================= -->
        <p-dialog
            [(visible)]="bajaDialogVisible"
            [style]="{ width: '450px' }"
            header="Registrar Baja de Inventario (Merma)"
            [modal]="true"
            [dismissableMask]="true"
            appendTo="body"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4 mt-2">
                    <div class="bg-surface-50 p-3 rounded border border-surface-200 text-xs">
                        <div>SKU: <strong class="font-mono">{{ selectedSku()?.clItem }}</strong></div>
                        <div class="mt-1">Variante: <strong>{{ selectedSku()?.colorName }} - Talla {{ selectedSku()?.tallaName }}</strong></div>
                        <div class="mt-1">Stock Disponible Actual: <strong class="text-red-500">{{ selectedSku()?.noStockDisponible }}</strong></div>
                    </div>
                    <div>
                        <label class="block font-bold mb-2">Cantidad a Descontar <span class="text-red-500">*</span></label>
                        <input
                            type="number"
                            pInputText
                            [ngModel]="formCantidad()"
                            (ngModelChange)="formCantidad.set($event)"
                            min="1"
                            [max]="selectedSku()?.noStockDisponible || 9999"
                            class="w-full"
                        />
                    </div>
                    <div>
                        <label class="block font-bold mb-2">Motivo de la Baja <span class="text-red-500">*</span></label>
                        <textarea
                            pTextarea
                            [ngModel]="formMotivo()"
                            (ngModelChange)="formMotivo.set($event)"
                            rows="3"
                            placeholder="Ej. Producto dañado, muestra comercial, merma..."
                            fluid
                        ></textarea>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="bajaDialogVisible.set(false)" />
                    <p-button label="Registrar Baja" icon="pi pi-check" severity="danger" [loading]="savingMovimiento()" (onClick)="guardarBaja()" />
                </div>
            </ng-template>
        </p-dialog>

        <!-- ================= DIÁLOGO DE AJUSTE ================= -->
        <p-dialog
            [(visible)]="ajusteDialogVisible"
            [style]="{ width: '450px' }"
            header="Registrar Ajuste de Inventario"
            [modal]="true"
            [dismissableMask]="true"
            appendTo="body"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4 mt-2">
                    <div class="bg-surface-50 p-3 rounded border border-surface-200 text-xs">
                        <div>SKU: <strong class="font-mono">{{ selectedSku()?.clItem }}</strong></div>
                        <div class="mt-1">Variante: <strong>{{ selectedSku()?.colorName }} - Talla {{ selectedSku()?.tallaName }}</strong></div>
                        <div class="mt-1">Stock Disponible Actual: <strong>{{ selectedSku()?.noStockDisponible }}</strong></div>
                    </div>
                    <div>
                        <label class="block font-bold mb-2">Stock Físico Real Comprobado <span class="text-red-500">*</span></label>
                        <input
                            type="number"
                            pInputText
                            [ngModel]="formStockFisicoReal()"
                            (ngModelChange)="formStockFisicoReal.set($event)"
                            min="0"
                            class="w-full"
                        />
                        <small class="text-surface-500 mt-1 block">
                            El sistema calculará automáticamente el diferencial y registrará un movimiento por la diferencia física.
                        </small>
                    </div>
                    <div>
                        <label class="block font-bold mb-2">Motivo del Ajuste <span class="text-red-500">*</span></label>
                        <textarea
                            pTextarea
                            [ngModel]="formMotivo()"
                            (ngModelChange)="formMotivo.set($event)"
                            rows="3"
                            placeholder="Ej. Inventario físico anual, corrección de descuadre..."
                            fluid
                        ></textarea>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="ajusteDialogVisible.set(false)" />
                    <p-button label="Aplicar Ajuste" icon="pi pi-check" severity="warn" [loading]="savingMovimiento()" (onClick)="guardarAjuste()" />
                </div>
            </ng-template>
        </p-dialog>

        <!-- ================= DIÁLOGO DE KARDEX (HISTORIAL) ================= -->
        <p-dialog
            [(visible)]="kardexDialogVisible"
            [style]="{ width: '850px' }"
            header="Historial de Movimientos (Kardex)"
            [modal]="true"
            [dismissableMask]="true"
            appendTo="body"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4 mt-2">
                    <div class="bg-surface-50 p-3 rounded border border-surface-200 flex justify-between items-center text-xs">
                        <div>
                            <div>SKU: <strong class="font-mono text-sm">{{ selectedSku()?.clItem }}</strong></div>
                            <div class="mt-1">Variante: <strong>{{ selectedSku()?.colorName }} - Talla {{ selectedSku()?.tallaName }}</strong></div>
                        </div>
                        <div class="text-right">
                            <div>Stock Disponible: <strong class="text-sm text-green-500 font-bold">{{ selectedSku()?.noStockDisponible }}</strong></div>
                        </div>
                    </div>

                    <p-table
                        [value]="kardexMovimientos()"
                        [loading]="loadingKardex()"
                        [paginator]="true"
                        [rows]="5"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} movimientos"
                        [rowHover]="true"
                        responsiveLayout="scroll"
                    >
                        <ng-template #header>
                            <tr>
                                <th style="width: 11rem">Fecha y Hora</th>
                                <th style="width: 8rem">Tipo</th>
                                <th style="width: 7rem">Cantidad</th>
                                <th style="min-width: 14rem">Motivo</th>
                                <th style="width: 9rem">Operador</th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-mov>
                            <tr>
                                <td class="text-xs font-mono">{{ formatFecha(mov.feCreacion) }}</td>
                                <td>
                                    <p-tag
                                        [value]="mov.clTipoMovimiento"
                                        [severity]="getTipoMovimientoSeverity(mov.clTipoMovimiento)"
                                    />
                                </td>
                                <td class="font-mono font-bold">
                                    <span [class.text-green-500]="mov.noCantidad > 0" [class.text-red-500]="mov.noCantidad < 0">
                                        {{ mov.noCantidad > 0 ? '+' : '' }}{{ mov.noCantidad }}
                                    </span>
                                </td>
                                <td class="text-sm">{{ mov.dsMotivo }}</td>
                                <td class="text-xs text-surface-500">{{ mov.clOperadorCrea }}</td>
                            </tr>
                        </ng-template>
                        <ng-template #emptymessage>
                            <tr>
                                <td colspan="5" class="text-center py-8 text-surface-500">
                                    No hay movimientos de inventario registrados para este SKU.
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end">
                    <p-button label="Cerrar" icon="pi pi-times" (onClick)="kardexDialogVisible.set(false)" />
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class Inventario implements OnInit {
    private readonly apiService = inject(InventarioApiService);
    private readonly productosService = inject(ProductosGuanteApiService);
    private readonly catalogosService = inject(CatalogosApiService);
    private readonly messageService = inject(MessageService);
    private readonly destroyRef = inject(DestroyRef);

    // Listas principales
    productosGuanteList = signal<ProductoGuante[]>([]);
    productoSeleccionadoId = signal<string>('');
    productoSeleccionado = signal<ProductoGuante | null>(null);
    loadingStocks = signal<boolean>(false);

    // Catálogos auxiliares
    catalogosLoaded = signal<boolean>(false);
    combinacionesMap: Record<number, string> = {};
    tallasMap: Record<number, string> = {};

    // Modales y Formularios
    selectedSku = signal<any | null>(null);
    entradaDialogVisible = signal<boolean>(false);
    bajaDialogVisible = signal<boolean>(false);
    ajusteDialogVisible = signal<boolean>(false);
    kardexDialogVisible = signal<boolean>(false);

    formCantidad = signal<number>(1);
    formStockFisicoReal = signal<number>(0);
    formMotivo = signal<string>('');
    savingMovimiento = signal<boolean>(false);

    kardexMovimientos = signal<MovimientoInventarioDto[]>([]);
    loadingKardex = signal<boolean>(false);

    productosGuanteOptions = computed(() => this.productosGuanteList().map(p => ({
            label: `${p.nbProducto} (${p.clProducto})`,
            value: p.id || (p as any).idProducto
        })));

    flatSkus = computed(() => {
        const prod = this.productoSeleccionado();

        if (!prod || !prod.variantes) return [];

        const items: SkuFlatItem[] = [];

        prod.variantes.forEach(v => {
            const colorName = this.combinacionesMap[v.idElemCombinacion] || `Combinación ${v.idElemCombinacion}`;

            if (v.skus) {
                v.skus.forEach(s => {
                    const tallaName = this.tallasMap[s.idElemTalla] || `Talla ${s.idElemTalla}`;

                    items.push({
                        idSku: s.idSku || '',
                        clItem: s.clItem,
                        idElemTalla: s.idElemTalla,
                        tallaName: tallaName,
                        colorName: colorName,
                        noStockDisponible: s.noStockDisponible,
                        noStockReservado: s.noStockReservado
                    });
                });
            }
        });

        return items;
    });

    ngOnInit(): void {
        this.cargarCatalogos();
        this.cargarProductosGuante();
    }

    cargarCatalogos(): void {
        if (this.catalogosLoaded()) return;

        forkJoin({
            combinaciones: this.catalogosService.getElementos('COMBINACIONES'),
            tallas: this.catalogosService.getElementos('TALLAS')
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (res) => {
                (res.combinaciones || []).forEach(e => {
                    if (e.idCatalogoElemento !== undefined) {
                        this.combinacionesMap[e.idCatalogoElemento] = e.nbCatalogoElemento;
                    }
                });
                (res.tallas || []).forEach(e => {
                    if (e.idCatalogoElemento !== undefined) {
                        this.tallasMap[e.idCatalogoElemento] = e.nbCatalogoElemento;
                    }
                });
                this.catalogosLoaded.set(true);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los catálogos auxiliares de color y talla.' });
            }
        });
    }

    cargarProductosGuante(): void {
        this.productosService.getProductosGuantes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                this.productosGuanteList.set(data || []);
            }
        });
    }

    onProductoChange(): void {
        const id = this.productoSeleccionadoId();

        if (!id) {
            this.productoSeleccionado.set(null);

            return;
        }

        this.loadingStocks.set(true);
        this.productosService.getProductoGuante(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (prod) => {
                this.productoSeleccionado.set(prod);
                this.loadingStocks.set(false);
            },
            error: () => {
                this.loadingStocks.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron consultar existencias del producto.' });
            }
        });
    }

    // --- ACCIONES FORMULARIOS ---

    abrirEntrada(sku: SkuFlatItem): void {
        this.selectedSku.set(sku);
        this.formCantidad.set(1);
        this.formMotivo.set('');
        this.entradaDialogVisible.set(true);
    }

    guardarEntrada(): void {
        const sku = this.selectedSku();
        const cantidad = this.formCantidad();
        const motivo = this.formMotivo().trim();

        if (!cantidad || cantidad <= 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'La cantidad debe ser mayor a 0.' });

            return;
        }

        if (!motivo) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe ingresar un motivo para el movimiento.' });

            return;
        }

        this.savingMovimiento.set(true);
        this.apiService.registrarEntrada({
            idSku: sku.idSku,
            noCantidad: cantidad,
            dsMotivo: motivo
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Entrada registrada con éxito para SKU ${sku.clItem}` });
                this.savingMovimiento.set(false);
                this.entradaDialogVisible.set(false);
                this.onProductoChange();
            },
            error: (err) => {
                this.savingMovimiento.set(false);
                const msg = err?.error?.message || err?.error?.Message || 'No se pudo registrar la entrada de inventario.';

                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }

    abrirBaja(sku: SkuFlatItem): void {
        this.selectedSku.set(sku);
        this.formCantidad.set(1);
        this.formMotivo.set('');
        this.bajaDialogVisible.set(true);
    }

    guardarBaja(): void {
        const sku = this.selectedSku();
        const cantidad = this.formCantidad();
        const motivo = this.formMotivo().trim();

        if (!cantidad || cantidad <= 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'La cantidad debe ser mayor a 0.' });

            return;
        }

        if (cantidad > sku.noStockDisponible) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'La cantidad excede el stock disponible actual.' });

            return;
        }

        if (!motivo) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe ingresar un motivo para el movimiento.' });

            return;
        }

        this.savingMovimiento.set(true);
        this.apiService.registrarBaja({
            idSku: sku.idSku,
            noCantidad: cantidad,
            dsMotivo: motivo
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Baja registrada con éxito para SKU ${sku.clItem}` });
                this.savingMovimiento.set(false);
                this.bajaDialogVisible.set(false);
                this.onProductoChange();
            },
            error: (err) => {
                this.savingMovimiento.set(false);
                const msg = err?.error?.message || err?.error?.Message || 'No se pudo registrar la baja de inventario.';

                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }

    abrirAjuste(sku: SkuFlatItem): void {
        this.selectedSku.set(sku);
        this.formStockFisicoReal.set(sku.noStockDisponible);
        this.formMotivo.set('');
        this.ajusteDialogVisible.set(true);
    }

    guardarAjuste(): void {
        const sku = this.selectedSku();
        const stockFisico = this.formStockFisicoReal();
        const motivo = this.formMotivo().trim();

        if (stockFisico === undefined || stockFisico < 0) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El stock físico real no puede ser menor a 0.' });

            return;
        }

        if (!motivo) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe especificar el motivo del ajuste físico.' });

            return;
        }

        this.savingMovimiento.set(true);
        this.apiService.registrarAjuste({
            idSku: sku.idSku,
            noStockFisicoReal: stockFisico,
            dsMotivo: motivo
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Ajuste de inventario aplicado para SKU ${sku.clItem}` });
                this.savingMovimiento.set(false);
                this.ajusteDialogVisible.set(false);
                this.onProductoChange();
            },
            error: (err) => {
                this.savingMovimiento.set(false);
                const msg = err?.error?.message || err?.error?.Message || 'No se pudo aplicar el ajuste de inventario.';

                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }

    abrirKardex(sku: SkuFlatItem): void {
        this.selectedSku.set(sku);
        this.kardexMovimientos.set([]);
        this.loadingKardex.set(true);
        this.kardexDialogVisible.set(true);

        this.apiService.getKardex(sku.idSku).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                this.kardexMovimientos.set(data || []);
                this.loadingKardex.set(false);
            },
            error: () => {
                this.loadingKardex.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo consultar el historial de movimientos (Kardex).' });
            }
        });
    }

    // --- FORMATEO AUXILIARES ---

    getTipoMovimientoSeverity(tipo: string): "success" | "danger" | "warn" | "info" | "secondary" | "contrast" | null | undefined {
        switch (tipo) {
            case 'ENTRADA': return 'success';
            case 'BAJA': return 'danger';
            case 'AJUSTE': return 'warn';
            case 'VENTA': return 'info';
            default: return 'secondary';
        }
    }

    formatFecha(fechaStr: string): string {
        if (!fechaStr) return '';
        const date = new Date(fechaStr);

        return date.toLocaleString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}
