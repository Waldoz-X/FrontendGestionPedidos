import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { AccordionModule } from 'primeng/accordion';
import { TabsModule } from 'primeng/tabs';

import { 
    ProductoGuante, 
    CrearProductoGuanteRequest, 
    ActualizarProductoGuanteRequest,
    VarianteNestedDto,
    SkuNestedDto
} from '../service/productos-guante/productos-guante-api.types';
import { ProductosGuanteApiService } from '../service/productos-guante/productos-guante-api.service';
import { CatalogosApiService, CatalogoElemento } from '../service/catalogos-api.service';

@Component({
    selector: 'app-productos-guante',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        DialogModule,
        ConfirmDialogModule,
        IconFieldModule,
        InputIconModule,
        TooltipModule,
        TextareaModule,
        AccordionModule,
        TabsModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <div class="card">
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Productos Guante</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Gestión de productos guante en el sistema.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarProductos()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <p-table
                #dt
                [value]="productos()"
                dataKey="id"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} guantes"
                [showCurrentPageReport]="true"
                [globalFilterFields]="['clProducto', 'nbProducto', 'clHsCode', 'clMsCode', 'nbPalma']"
                [tableStyle]="{ 'min-width': '70rem' }"
                [rowHover]="true"
            >
                <ng-template #caption>
                    <div class="flex items-center justify-between">
                        <span></span>
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search" />
                            <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
                        </p-iconfield>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="clProducto" style="min-width: 10rem">Código <p-sortIcon field="clProducto" /></th>
                        <th pSortableColumn="nbProducto" style="min-width: 14rem">Producto <p-sortIcon field="nbProducto" /></th>
                        <th pSortableColumn="clHsCode" style="min-width: 10rem">HS Code <p-sortIcon field="clHsCode" /></th>
                        <th pSortableColumn="nbPalma" style="min-width: 12rem">Palma <p-sortIcon field="nbPalma" /></th>
                        <th pSortableColumn="clEstatusProducto" style="min-width: 8rem">Estatus <p-sortIcon field="clEstatusProducto" /></th>
                        <th style="min-width: 10rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-prod>
                    <tr>
                        <td class="font-medium">{{ prod.clProducto }}</td>
                        <td class="font-medium">{{ prod.nbProducto }}</td>
                        <td class="font-mono">{{ prod.clHsCode || 'N/A' }}</td>
                        <td>{{ prod.nbPalma || 'N/A' }}</td>
                        <td>
                            <p-tag [value]="prod.clEstatusProducto === 'ACTIVO' ? 'Activo' : 'Inactivo'" [severity]="prod.clEstatusProducto === 'ACTIVO' ? 'success' : 'danger'" />
                        </td>
                        <td>
                            <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (onClick)="editarProducto(prod)" pTooltip="Editar" />
                            <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (onClick)="confirmarEliminar(prod)" pTooltip="Eliminar" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="6">No hay guantes para mostrar.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO CREAR / EDITAR ═══ -->
        <p-dialog
            [(visible)]="dialogVisible"
            [style]="{ width: '900px' }"
            [header]="editando() ? 'Editar Guante' : 'Nuevo Guante'"
            [modal]="true"
        >
            <ng-template #content>
                <p-tabs value="0">
                    <p-tablist>
                        <p-tab value="0"><i class="pi pi-info-circle mr-2"></i>General</p-tab>
                        <p-tab value="1"><i class="pi pi-list mr-2"></i>Especificaciones</p-tab>
                        <p-tab value="2"><i class="pi pi-tags mr-2"></i>Variantes y Tallas</p-tab>
                    </p-tablist>

                    <p-tabpanels>
                        <!-- PESTAÑA 1: GENERAL -->
                        <p-tabpanel value="0">
                            <div class="flex flex-col gap-6 pt-4">
                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">Clave de Producto</label>
                                        <input type="text" pInputText [(ngModel)]="datosFormulario.clProducto" required fluid />
                                        @if (submitted() && !datosFormulario.clProducto) { <small class="text-red-500">Requerido.</small> }
                                    </div>
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">Nombre del Producto</label>
                                        <input type="text" pInputText [(ngModel)]="datosFormulario.nbProducto" required fluid />
                                        @if (submitted() && !datosFormulario.nbProducto) { <small class="text-red-500">Requerido.</small> }
                                    </div>
                                </div>

                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">División</label>
                                        <p-select appendTo="body" [(ngModel)]="datosFormulario.idElemDivision" [options]="divisiones()" optionLabel="label" optionValue="value" placeholder="Seleccionar" fluid />
                                    </div>
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">Línea / Colección</label>
                                        <p-select appendTo="body" [(ngModel)]="datosFormulario.idElemLineaColeccion" [options]="colecciones()" optionLabel="label" optionValue="value" placeholder="Seleccionar" fluid />
                                    </div>
                                </div>

                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-6 md:col-span-6">
                                        <label class="block font-bold mb-3">Gama</label>
                                        <p-select appendTo="body" [(ngModel)]="datosFormulario.idElemGama" [options]="gamas()" optionLabel="label" optionValue="value" placeholder="Seleccionar" fluid />
                                    </div>
                                    <div class="col-span-6 md:col-span-6">
                                        <label class="block font-bold mb-3">Estado del Prod.</label>
                                        <p-select appendTo="body" [(ngModel)]="datosFormulario.idElemEstadoProducto" [options]="estadosProd()" optionLabel="label" optionValue="value" placeholder="Seleccionar" fluid />
                                    </div>
                                </div>

                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">Estatus</label>
                                        <p-select appendTo="body" [(ngModel)]="datosFormulario.clEstatusProducto" [options]="estatusOptions" fluid />
                                    </div>
                                </div>
                            </div>
                        </p-tabpanel>

                        <!-- PESTAÑA 2: ESPECIFICACIONES -->
                        <p-tabpanel value="1">
                            <div class="flex flex-col gap-6 pt-4">
                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-6 md:col-span-4">
                                        <label class="block font-bold mb-3">HS Code</label>
                                        <input type="text" pInputText [(ngModel)]="datosFormulario.clHsCode" fluid />
                                    </div>
                                    <div class="col-span-6 md:col-span-4">
                                        <label class="block font-bold mb-3">MS Code</label>
                                        <input type="text" pInputText [(ngModel)]="datosFormulario.clMsCode" fluid />
                                    </div>
                                    <div class="col-span-6 md:col-span-4">
                                        <label class="block font-bold mb-3">Índice Palma</label>
                                        <input type="text" pInputText [(ngModel)]="datosFormulario.clIndicePalma" fluid />
                                    </div>
                                </div>

                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">Nombre Palma</label>
                                        <input type="text" pInputText [(ngModel)]="datosFormulario.nbPalma" fluid />
                                    </div>
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">Composición</label>
                                        <textarea pTextarea [(ngModel)]="datosFormulario.dsComposicion" rows="2" fluid></textarea>
                                    </div>
                                </div>

                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">Forro</label>
                                        <textarea pTextarea [(ngModel)]="datosFormulario.dsForro" rows="2" fluid></textarea>
                                    </div>
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">Cierre</label>
                                        <textarea pTextarea [(ngModel)]="datosFormulario.dsCierre" rows="2" fluid></textarea>
                                    </div>
                                </div>

                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-12">
                                        <label class="block font-bold mb-3">Homologación</label>
                                        <textarea pTextarea [(ngModel)]="datosFormulario.dsHomologacion" rows="2" fluid></textarea>
                                    </div>
                                </div>
                            </div>
                        </p-tabpanel>

                        <!-- PESTAÑA 3: VARIANTES Y SKUS -->
                        <p-tabpanel value="2">
                            <div class="pt-4">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-xl font-bold m-0">Catálogo de Variantes</h3>
                                    <p-button label="Agregar Variante" icon="pi pi-plus" (onClick)="agregarVariante()" />
                                </div>

                                <p-accordion [multiple]="true" value="0">
                                    @for (variante of datosFormulario.variantes; track $index; let i = $index) {
                                        <p-accordion-panel [value]="i.toString()">
                                            <p-accordion-header>Variante {{i + 1}}</p-accordion-header>
                                            <p-accordion-content>
                                                <div class="flex justify-end mb-4">
                                                    <p-button icon="pi pi-trash" severity="danger" [text]="true" label="Eliminar Variante" (onClick)="removerVariante(i)" />
                                                </div>
                                                <div class="grid grid-cols-12 gap-4 mb-4">
                                                    <div class="col-span-12 md:col-span-4">
                                                        <label class="block font-bold mb-2">Combinación</label>
                                                        <p-select appendTo="body" [(ngModel)]="variante.idElemCombinacion" [options]="combinaciones()" optionLabel="label" optionValue="value" [filter]="true" filterBy="label" placeholder="Buscar combinación..." fluid />
                                                    </div>
                                                    <div class="col-span-12 md:col-span-4">
                                                        <label class="block font-bold mb-2">URL Imagen</label>
                                                        <input type="text" pInputText [(ngModel)]="variante.urlImagen" fluid />
                                                    </div>
                                                    <div class="col-span-12 md:col-span-4">
                                                        <label class="block font-bold mb-2">Estatus</label>
                                                        <p-select appendTo="body" [(ngModel)]="variante.clEstatusVariante" [options]="estatusOptions" fluid />
                                                    </div>
                                                </div>

                                                <div class="bg-surface-50 dark:bg-surface-900 p-4 rounded-lg mt-4">
                                                    <div class="flex justify-between items-center mb-4">
                                                        <h4 class="font-bold m-0">Tallas (SKUs)</h4>
                                                        <p-button label="Agregar Talla" icon="pi pi-plus" size="small" severity="secondary" (onClick)="agregarSku(i)" />
                                                    </div>

                                                    <p-table [value]="variante.skus">
                                                        <ng-template #header>
                                                            <tr>
                                                                <th>Talla</th>
                                                                <th>C. Item</th>
                                                                <th>C. Barras</th>
                                                                <th>Estatus</th>
                                                                <th pTooltip="Stock Disponible">S. Disp</th>
                                                                <th pTooltip="Stock Reservado">S. Res</th>
                                                                <th></th>
                                                            </tr>
                                                        </ng-template>
                                                        <ng-template #body let-sku let-j="rowIndex">
                                                            <tr>
                                                                <td>
                                                                    <p-select appendTo="body" [(ngModel)]="sku.idElemTalla" [options]="tallas()" optionLabel="label" optionValue="value" placeholder="Selec." styleClass="w-32" />
                                                                </td>
                                                                <td><input pInputText [(ngModel)]="sku.clItem" class="w-24" /></td>
                                                                <td><input pInputText [(ngModel)]="sku.clCodigoBarras" class="w-32" /></td>
                                                                <td><p-select appendTo="body" [(ngModel)]="sku.clEstatusSku" [options]="estatusOptions" styleClass="w-32" /></td>
                                                                <td><input type="number" pInputText [(ngModel)]="sku.noStockDisponible" class="w-20" /></td>
                                                                <td><input type="number" pInputText [(ngModel)]="sku.noStockReservado" class="w-20" /></td>
                                                                <td>
                                                                    <p-button icon="pi pi-trash" severity="danger" [text]="true" (onClick)="removerSku(i, j)" />
                                                                </td>
                                                            </tr>
                                                        </ng-template>
                                                        <ng-template #emptymessage>
                                                            <tr>
                                                                <td colspan="7">No hay tallas configuradas para esta variante.</td>
                                                            </tr>
                                                        </ng-template>
                                                    </p-table>
                                                </div>
                                            </p-accordion-content>
                                        </p-accordion-panel>
                                    }
                                </p-accordion>
                            </div>
                        </p-tabpanel>
                    </p-tabpanels>
                </p-tabs>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="dialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardar()" [loading]="saving()" />
            </ng-template>
        </p-dialog>
    `
})
export class ProductosGuante implements OnInit {
    private readonly apiService = inject(ProductosGuanteApiService);
    private readonly catalogosService = inject(CatalogosApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);

    // ─── State ───
    productos = signal<ProductoGuante[]>([]);
    loading = signal<boolean>(false);
    saving = signal<boolean>(false);

    // ─── Dropdown Options ───
    divisiones = signal<{label: string, value: number}[]>([]);
    colecciones = signal<{label: string, value: number}[]>([]);
    gamas = signal<{label: string, value: number}[]>([]);
    estadosProd = signal<{label: string, value: number}[]>([]);
    combinaciones = signal<{label: string, value: number}[]>([]);
    tallas = signal<{label: string, value: number}[]>([]);

    estatusOptions = [
        { label: 'ACTIVO', value: 'ACTIVO' },
        { label: 'INACTIVO', value: 'INACTIVO' }
    ];

    // ─── Form Dialog ───
    dialogVisible = false;
    editando = signal<boolean>(false);
    submitted = signal<boolean>(false);
    idEditando = '';
    
    datosFormulario: CrearProductoGuanteRequest = {
        clProducto: '',
        nbProducto: '',
        idElemDivision: 0,
        idElemLineaColeccion: 0,
        idElemGama: 0,
        idElemEstadoProducto: 0,
        clHsCode: '',
        clEstatusProducto: 'ACTIVO',
        nbPalma: '',
        dsComposicion: '',
        clMsCode: '',
        clIndicePalma: '',
        dsForro: '',
        dsCierre: '',
        dsHomologacion: '',
        variantes: []
    };

    private searchSubject = new Subject<{table: Table, query: string}>();

    ngOnInit(): void {
        this.cargarCatalogos();
        this.cargarProductos();

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged((prev, curr) => prev.query === curr.query),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(({table, query}) => {
            table.filterGlobal(query, 'contains');
        });
    }

    cargarCatalogos(): void {
        const fetchCatalogo = (clCatalogo: string, targetSignal: any) => {
            this.catalogosService.getElementos(clCatalogo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                next: (data: CatalogoElemento[]) => {
                    targetSignal.set((data || []).map((m) => ({
                        label: m.nbCatalogoElemento || m.clCatalogoElemento,
                        value: m.idCatalogoElemento
                    })));
                },
                error: () => console.error('Error cargando ' + clCatalogo)
            });
        };

        fetchCatalogo('DIVISIONES', this.divisiones);
        fetchCatalogo('LINEAS_COLECCION', this.colecciones);
        fetchCatalogo('GAMAS', this.gamas);
        fetchCatalogo('ESTADOS_PRODUCTO', this.estadosProd);
        fetchCatalogo('COMBINACIONES', this.combinaciones);
        fetchCatalogo('TALLAS', this.tallas);
    }

    cargarProductos(): void {
        this.loading.set(true);

        this.apiService.getProductosGuantes().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => {
                this.productos.set(data);
                this.loading.set(false);
            },
            error: (error: HttpErrorResponse) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los guantes.', life: 5000 });
            }
        });
    }

    onGlobalFilter(table: Table, event: Event): void {
        this.searchSubject.next({ table, query: (event.target as HTMLInputElement).value });
    }

    abrirNuevo(): void {
        this.editando.set(false);
        this.resetForm();
        this.submitted.set(false);
        this.dialogVisible = true;
    }

    editarProducto(prod: ProductoGuante): void {
        this.editando.set(true);
        this.idEditando = prod.id || (prod as any).idProducto;
        this.datosFormulario = { ...prod };
        if (!this.datosFormulario.variantes) {
            this.datosFormulario.variantes = [];
        }
        this.submitted.set(false);
        this.dialogVisible = true;
    }

    // --- Dynamic Variants & SKUs ---

    agregarVariante(): void {
        this.datosFormulario.variantes.push({
            idElemCombinacion: 0,
            urlImagen: '',
            clEstatusVariante: 'ACTIVO',
            skus: []
        });
    }

    removerVariante(index: number): void {
        this.datosFormulario.variantes.splice(index, 1);
    }

    agregarSku(varianteIndex: number): void {
        this.datosFormulario.variantes[varianteIndex].skus.push({
            idElemTalla: 0,
            clItem: '',
            clCodigoBarras: '',
            clEstatusSku: 'ACTIVO',
            noStockDisponible: 0,
            noStockReservado: 0
        });
    }

    removerSku(varianteIndex: number, skuIndex: number): void {
        this.datosFormulario.variantes[varianteIndex].skus.splice(skuIndex, 1);
    }

    guardar(): void {
        this.submitted.set(true);

        if (!this.datosFormulario.clProducto?.trim() || !this.datosFormulario.nbProducto?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'La Clave y el Nombre del producto son requeridos.' });
            return;
        }

        this.saving.set(true);

        const request$ = this.editando() 
            ? this.apiService.actualizarProductoGuante(this.idEditando, this.datosFormulario)
            : this.apiService.crearProductoGuante(this.datosFormulario);

        request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.saving.set(false);
                this.dialogVisible = false;
                this.cargarProductos();
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Registro guardado correctamente.' });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error al guardar', detail: 'Ocurrió un error al intentar guardar el guante.' });
            }
        });
    }

    confirmarEliminar(prod: ProductoGuante): void {
        this.confirmationService.confirm({
            message: '¿Eliminar el guante ' + prod.nbProducto + '?',
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const id = prod.id || (prod as any).idProducto;
                this.apiService.eliminarProductoGuante(id).pipe(
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe({
                    next: () => {
                        this.cargarProductos();
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Guante eliminado correctamente.' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el registro.' })
                });
            }
        });
    }

    private resetForm(): void {
        this.datosFormulario = {
            clProducto: '',
            nbProducto: '',
            idElemDivision: 0,
            idElemLineaColeccion: 0,
            idElemGama: 0,
            idElemEstadoProducto: 0,
            clHsCode: '',
            clEstatusProducto: 'ACTIVO',
            nbPalma: '',
            dsComposicion: '',
            clMsCode: '',
            clIndicePalma: '',
            dsForro: '',
            dsCierre: '',
            dsHomologacion: '',
            variantes: []
        };
    }
}
