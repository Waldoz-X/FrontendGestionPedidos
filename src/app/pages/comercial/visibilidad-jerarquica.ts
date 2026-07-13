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

import { VisibilidadApiService } from '../service/visibilidad/visibilidad-api.service';
import { VisibilidadDto } from '../service/visibilidad/visibilidad-api.types';
import { ClientesAdminService } from '../service/clientes-admin.service';
import { ClienteAdmin } from '../service/clientes-admin-api.types';
import { ProductosGuanteApiService } from '../service/productos-guante/productos-guante-api.service';
import { ProductoGuante } from '../service/productos-guante/productos-guante-api.types';
import { CatalogosApiService } from '../service/catalogos-api.service';

@Component({
    selector: 'p-visibilidad-jerarquica',
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
        InputTextModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Reglas de Visibilidad Jerárquica</div>
                        <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
                            Configure exclusiones específicas a nivel de **Producto**, **Variante (Color)** o **SKU (Talla)**.
                        </p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button
                        severity="primary"
                        label="Asignar Regla"
                        icon="pi pi-plus"
                        (onClick)="abrirNuevaRegla()"
                        [disabled]="!productoSeleccionadoId()"
                    />
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
                            <i class="pi pi-info-circle mr-1"></i> Se muestran todas las excepciones (reglas explícitas) configuradas para este producto.
                        </span>
                    }
                </div>
            </div>

            <!-- TABLA DE REGLAS DE VISIBILIDAD -->
            @if (productoSeleccionadoId()) {
                <p-table
                    [value]="reglasProductoList()"
                    [loading]="loadingReglas()"
                    [paginator]="true"
                    [rows]="10"
                    [showCurrentPageReport]="true"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} reglas"
                    [rowHover]="true"
                    responsiveLayout="scroll"
                >
                    <ng-template #header>
                        <tr>
                            <th style="min-width: 14rem">Cliente</th>
                            <th style="min-width: 10rem">Alcance de la Regla</th>
                            <th style="min-width: 12rem">Detalle</th>
                            <th style="min-width: 8rem">Tipo de Acceso</th>
                            <th style="width: 5rem"></th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-regla>
                        <tr>
                            <td class="font-semibold">{{ regla.nbComercialCliente }}</td>
                            <td>
                                @if (regla.idSku) {
                                    <p-tag value="SKU (Talla)" severity="info" />
                                } @else if (regla.idVariante) {
                                    <p-tag value="Variante (Color)" severity="secondary" />
                                } @else {
                                    <p-tag value="Producto Completo" severity="success" />
                                }
                            </td>
                            <td>
                                @if (regla.idSku) {
                                    <span class="font-mono text-xs">{{ regla.clItem || 'SKU' }}</span>
                                } @else if (regla.idVariante) {
                                    <span>{{ regla.nbCombinacion || 'Variante' }}</span>
                                } @else {
                                    <span class="text-surface-400">Todo el producto</span>
                                }
                            </td>
                            <td>
                                <p-tag
                                    [value]="regla.clTipoAcceso"
                                    [severity]="regla.clTipoAcceso === 'EXCLUSIVO' ? 'warn' : 'success'"
                                />
                            </td>
                            <td>
                                <p-button
                                    icon="pi pi-trash"
                                    severity="danger"
                                    [rounded]="true"
                                    [outlined]="true"
                                    (onClick)="confirmarEliminarRegla(regla)"
                                    pTooltip="Revocar Acceso"
                                />
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="5" class="text-center py-8 text-surface-500">
                                No hay reglas de visibilidad específicas creadas para este producto.
                                <br />
                                <span class="text-xs text-surface-400 block mt-1">
                                    (Bajo la whitelist estricta, ningún cliente podrá verlo en su catálogo hasta asignarle acceso)
                                </span>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            } @else {
                <div class="text-center text-surface-500 py-16">
                    <i class="pi pi-box text-5xl mb-4 block"></i>
                    <p class="text-lg">Seleccione un producto para ver y configurar sus reglas de acceso granulares.</p>
                </div>
            }
        </div>

        <!-- ================= DIÁLOGO REGISTRO NUEVA REGLA GRANULAR ================= -->
        <p-dialog
            [(visible)]="dialogReglaVisible"
            [style]="{ width: '450px' }"
            header="Asignar Nueva Regla de Visibilidad"
            [modal]="true"
            [dismissableMask]="true"
            appendTo="body"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4 mt-2">
                    <div>
                        <label class="block font-bold mb-2">Cliente <span class="text-red-500">*</span></label>
                        <p-select
                            [ngModel]="formCliente()"
                            (ngModelChange)="formCliente.set($event)"
                            [options]="clientesOptions()"
                            optionLabel="label"
                            optionValue="value"
                            [filter]="true"
                            filterBy="label"
                            placeholder="Buscar cliente..."
                            fluid
                            appendTo="body"
                        />
                    </div>
                    
                    <div>
                        <label class="block font-bold mb-2">Tipo de Acceso <span class="text-red-500">*</span></label>
                        <p-select
                            [ngModel]="formTipoAcceso()"
                            (ngModelChange)="formTipoAcceso.set($event)"
                            [options]="tipoAccesoOptions"
                            fluid
                            appendTo="body"
                        />
                    </div>
                    
                    <div>
                        <label class="block font-bold mb-2">Alcance de la Regla <span class="text-red-500">*</span></label>
                        <p-select
                            [ngModel]="formAlcance()"
                            (ngModelChange)="formAlcance.set($event)"
                            [options]="alcanceOptions"
                            optionLabel="label"
                            optionValue="value"
                            fluid
                            appendTo="body"
                        />
                    </div>
                    
                    @if (formAlcance() === 'VARIANTE' || formAlcance() === 'SKU') {
                        <div>
                            <label class="block font-bold mb-2">Variante (Combinación) <span class="text-red-500">*</span></label>
                            <p-select
                                [ngModel]="formVariante()"
                                (ngModelChange)="formVariante.set($event)"
                                [options]="variantesOptions()"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Seleccionar combinación..."
                                fluid
                                appendTo="body"
                            />
                        </div>
                    }
                    
                    @if (formAlcance() === 'SKU') {
                        <div>
                            <label class="block font-bold mb-2">SKU (Talla / Item) <span class="text-red-500">*</span></label>
                            <p-select
                                [ngModel]="formSku()"
                                (ngModelChange)="formSku.set($event)"
                                [options]="skusOptions()"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Seleccionar talla..."
                                [disabled]="!formVariante()"
                                fluid
                                appendTo="body"
                            />
                        </div>
                    }
                </div>
            </ng-template>
            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="dialogReglaVisible.set(false)" />
                    <p-button label="Guardar" icon="pi pi-check" [loading]="savingRegla()" (onClick)="guardarReglaGranular()" />
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class VisibilidadJerarquica implements OnInit {
    private readonly apiService = inject(VisibilidadApiService);
    private readonly clientesService = inject(ClientesAdminService);
    private readonly productosService = inject(ProductosGuanteApiService);
    private readonly catalogosService = inject(CatalogosApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);

    // Listas principales
    clientesOptions = signal<{ label: string; value: string }[]>([]);
    productosGuanteList = signal<ProductoGuante[]>([]);
    productoSeleccionadoId = signal<string>('');
    productoSeleccionado = signal<ProductoGuante | null>(null);
    reglasProductoList = signal<VisibilidadDto[]>([]);
    loadingReglas = signal<boolean>(false);
    
    // Catálogos auxiliares
    catalogosLoaded = signal<boolean>(false);
    combinacionesMap: Record<number, string> = {};
    tallasMap: Record<number, string> = {};

    // Modal Crear Regla Granular
    dialogReglaVisible = signal<boolean>(false);
    savingRegla = signal<boolean>(false);
    formCliente = signal<string>('');
    formTipoAcceso = signal<string>('VISIBLE');
    formAlcance = signal<string>('PRODUCTO');
    formVariante = signal<string>('');
    formSku = signal<string>('');

    tipoAccesoOptions = ['VISIBLE', 'EXCLUSIVO'];
    
    alcanceOptions = [
        { label: 'Todo el Producto', value: 'PRODUCTO' },
        { label: 'Variante (Combinación)', value: 'VARIANTE' },
        { label: 'SKU (Talla / Item)', value: 'SKU' }
    ];

    productosGuanteOptions = computed(() => this.productosGuanteList().map(p => ({
            label: `${p.nbProducto} (${p.clProducto})`,
            value: p.id || (p as any).idProducto
        })));

    variantesOptions = computed(() => {
        const prod = this.productoSeleccionado();

        if (!prod || !prod.variantes) return [];

        return prod.variantes.map(v => {
            const nombreComb = this.combinacionesMap[v.idElemCombinacion] || `Combinación ${v.idElemCombinacion}`;

            return {
                label: nombreComb,
                value: v.idVariante || ''
            };
        });
    });

    skusOptions = computed(() => {
        const prod = this.productoSeleccionado();

        if (!prod || !prod.variantes) return [];
        const varId = this.formVariante();
        const selectedVar = prod.variantes.find(v => v.idVariante === varId);

        if (!selectedVar || !selectedVar.skus) return [];

        return selectedVar.skus.map(s => {
            const tallaNb = this.tallasMap[s.idElemTalla] || `Talla ${s.idElemTalla}`;

            return {
                label: `${tallaNb} (${s.clItem})`,
                value: s.idSku || ''
            };
        });
    });

    ngOnInit(): void {
        this.cargarClientes();
        this.cargarCatalogos();
        this.cargarProductosGuante();
    }

    cargarClientes(): void {
        this.clientesService.getClientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: ClienteAdmin[]) => {
                this.clientesOptions.set((data || []).map(c => ({
                    label: c.nbComercial,
                    value: c.id || (c as any).idCliente
                })));
            }
        });
    }

    cargarCatalogos(): void {
        if (this.catalogosLoaded()) return;

        this.loadingReglas.set(true);
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
                this.loadingReglas.set(false);
            },
            error: () => {
                this.loadingReglas.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los catálogos auxiliares.' });
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
            this.reglasProductoList.set([]);

            return;
        }

        this.loadingReglas.set(true);
        this.productosService.getProductoGuante(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (prod) => {
                this.productoSeleccionado.set(prod);
                this.cargarReglasProducto(id);
            },
            error: () => {
                this.loadingReglas.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle del producto.' });
            }
        });
    }

    cargarReglasProducto(idProducto: string): void {
        this.loadingReglas.set(true);
        this.apiService.getClientesProducto(idProducto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (reglas) => {
                this.reglasProductoList.set(reglas || []);
                this.loadingReglas.set(false);
            },
            error: () => {
                this.loadingReglas.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las reglas de visibilidad.' });
            }
        });
    }

    abrirNuevaRegla(): void {
        this.formCliente.set('');
        this.formTipoAcceso.set('VISIBLE');
        this.formAlcance.set('PRODUCTO');
        this.formVariante.set('');
        this.formSku.set('');
        this.dialogReglaVisible.set(true);
    }

    guardarReglaGranular(): void {
        const idCliente = this.formCliente();

        if (!idCliente) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un cliente.' });

            return;
        }

        const alcance = this.formAlcance();
        const payload: any = {
            idCliente: idCliente,
            clTipoAcceso: this.formTipoAcceso()
        };

        if (alcance === 'PRODUCTO') {
            payload.idProducto = this.productoSeleccionadoId();
        } else if (alcance === 'VARIANTE') {
            payload.idVariante = this.formVariante();

            if (!payload.idVariante) {
                this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar una variante.' });

                return;
            }
        } else if (alcance === 'SKU') {
            payload.idSku = this.formSku();

            if (!payload.idSku) {
                this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un SKU.' });

                return;
            }
        }

        this.savingRegla.set(true);
        this.apiService.asignarVisibilidad(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Regla de visibilidad guardada correctamente.' });
                this.savingRegla.set(false);
                this.dialogReglaVisible.set(false);
                this.cargarReglasProducto(this.productoSeleccionadoId());
            },
            error: (err: any) => {
                this.savingRegla.set(false);
                // Si el backend arrojó una excepción de redundancia (por ejemplo, BadRequest o Conflict con mensaje)
                const errorMsg = err?.error?.message || err?.error?.mensaje || err?.error?.Message || 'No se pudo guardar la regla de visibilidad.';

                this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
            }
        });
    }

    confirmarEliminarRegla(regla: VisibilidadDto): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de que desea revocar esta regla de visibilidad para el cliente <b>${regla.nbComercialCliente}</b>?`,
            header: 'Confirmar Revocación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, revocar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.loadingReglas.set(true);
                this.apiService.removerVisibilidadPorId(regla.idVisibilidad).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Regla revocada correctamente.' });
                        this.cargarReglasProducto(this.productoSeleccionadoId());
                    },
                    error: () => {
                        this.loadingReglas.set(false);
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo revocar la regla de visibilidad.' });
                    }
                });
            }
        });
    }
}
