import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';

import {
    CrearEstiloCatalogoRequest,
    CrearProductoCatalogoRequest,
    EstiloCatalogo,
    GetProductosCatalogoQuery,
    ProductoCatalogo,
    LineaColeccion,
    Serie
} from '../service/catalogo-api.types';
import { CatalogoService } from '../service/catalogo.service';

@Component({
    selector: 'p-catalogo-productos',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        CheckboxModule,
        DialogModule,
        ToastModule,
        ConfirmDialogModule,
        ToolbarModule,
        TagModule,
        IconFieldModule,
        InputIconModule,
        TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <div class="card">
            <!-- ═══ TOOLBAR ═══ -->
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Catálogo de Productos</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Gestión principal de productos y sus estilos base.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarProductos()" [loading]="loadingProductos()" />
                </ng-template>
            </p-toolbar>

            <!-- ═══ FILTROS AVANZADOS ═══ -->
            <div class="grid grid-cols-12 gap-4 mb-4">
                <div class="col-span-12 md:col-span-3">
                    <p-select [options]="estadoFiltroOptions" optionLabel="label" optionValue="value" [(ngModel)]="filtroActivo" [ngModelOptions]="{ standalone: true }" placeholder="Estado" class="w-full" appendTo="body"></p-select>
                </div>
                <div class="col-span-12 md:col-span-3">
                    <p-select [options]="divisionOptions" optionLabel="label" optionValue="value" [(ngModel)]="filtroDivision" [ngModelOptions]="{ standalone: true }" placeholder="División (Todas)" class="w-full" [showClear]="true" appendTo="body"></p-select>
                </div>
                <div class="col-span-12 md:col-span-4 flex gap-2">
                    <p-button label="Filtrar" icon="pi pi-filter" severity="secondary" (onClick)="cargarProductos()"></p-button>
                </div>
            </div>

            <!-- ═══ TABLA PRODUCTOS ═══ -->
            <p-table 
                #dt 
                [value]="productos()" 
                dataKey="id" 
                [loading]="loadingProductos()" 
                [paginator]="true" 
                [rows]="10" 
                [rowsPerPageOptions]="[10, 20, 50]"
                [globalFilterFields]="['modelo', 'division', 'serie']"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} productos"
                [showCurrentPageReport]="true"
                [rowHover]="true">
                
                <ng-template #caption>
                    <div class="flex items-center justify-between">
                        <span></span>
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search" />
                            <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar en resultados..." />
                        </p-iconfield>
                    </div>
                </ng-template>

                <ng-template #header>
                    <tr>
                        <th style="width: 5rem">Imagen</th>
                        <th pSortableColumn="modelo" style="min-width: 12rem">Modelo <p-sortIcon field="modelo" /></th>
                        <th pSortableColumn="division">División <p-sortIcon field="division" /></th>
                        <th pSortableColumn="serie">Serie <p-sortIcon field="serie" /></th>
                        <th pSortableColumn="activo">Estado <p-sortIcon field="activo" /></th>
                        <th style="min-width: 10rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-producto>
                    <tr>
                        <td>
                            <img [src]="previewByProductoId()[producto.id] || 'demo/images/product/product-placeholder.svg'" alt="Producto" width="46" class="border-round shadow-sm" />
                        </td>
                        <td class="font-medium">{{ producto.modelo }}</td>
                        <td>{{ producto.division }}</td>
                        <td>{{ producto.codigoSerie }}</td>
                        <td><p-tag [value]="producto.activo ? 'Activo' : 'Inactivo'" [severity]="producto.activo ? 'success' : 'danger'" /></td>
                        <td>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editarProducto(producto)" pTooltip="Editar" />
                                <p-button icon="pi pi-image" severity="secondary" [rounded]="true" [outlined]="true" (onClick)="abrirEstilos(producto)" pTooltip="Estilos" />
                                <!-- Botón de eliminar, requiere que el endpoint maneje borrado físico si se desea. -->
                                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="eliminarProducto(producto)" pTooltip="Eliminar" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="6">No hay productos registrados con los filtros actuales.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO PRODUCTO (CREAR/EDITAR) ═══ -->
        <p-dialog [(visible)]="productoDialog" [style]="{ width: '600px' }" [header]="productoEditandoId() ? 'Editar Producto' : 'Crear Producto'" [modal]="true">
            <ng-template #content>
                <form [formGroup]="productoForm" class="flex flex-col gap-6 mt-2 pb-2">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6">
                            <label for="modelo" class="block font-bold mb-2">Modelo</label>
                            <input pInputText id="modelo" formControlName="modelo" fluid autofocus placeholder="Ej: TX-200" />
                            @if (productoForm.get('modelo')?.invalid && (productoForm.get('modelo')?.dirty || productoForm.get('modelo')?.touched)) {
                                <small class="text-red-500 block mt-1">El modelo es requerido.</small>
                            }
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="division" class="block font-bold mb-2">División</label>
                            <p-select id="division" formControlName="division" [options]="divisionOptions" optionLabel="label" optionValue="value" class="w-full" fluid appendTo="body"></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="idSerieCatalogo" class="block font-bold mb-2">Serie</label>
                            <p-select id="idSerieCatalogo" formControlName="idSerieCatalogo" [options]="seriesOptions()" optionLabel="label" optionValue="value" class="w-full" [filter]="true" fluid placeholder="Selecciona la Serie..." appendTo="body"></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="idLineaColeccion" class="block font-bold mb-2">Línea de Colección</label>
                            <p-select id="idLineaColeccion" formControlName="idLineaColeccion" [options]="lineaColeccionOptions()" optionLabel="label" optionValue="value" class="w-full" [filter]="true" fluid placeholder="Selecciona..." appendTo="body" [showClear]="true"></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="gama" class="block font-bold mb-2">Gama</label>
                            <input pInputText id="gama" formControlName="gama" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="hsCode" class="block font-bold mb-2">HS Code</label>
                            <input pInputText id="hsCode" formControlName="hsCode" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="idEstado" class="block font-bold mb-2">Estado (ID)</label>
                            <input type="number" pInputText id="idEstado" formControlName="idEstado" fluid />
                        </div>
                        <div class="col-span-12 flex items-center gap-2 mt-2">
                            <p-checkbox inputId="activo" formControlName="activo" [binary]="true" />
                            <label for="activo" class="font-bold">Activo</label>
                        </div>
                    </div>
                </form>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="productoDialog = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarProducto()" [loading]="savingProducto()" />
            </ng-template>
        </p-dialog>

        <!-- ═══ DIALOGO ESTILOS ═══ -->
        <p-dialog [(visible)]="estilosDialog" [style]="{ width: '700px' }" [header]="'Gesti\u00F3n de Estilos - ' + productoSeleccionadoModelo()" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-4 mt-2">
                    <form [formGroup]="estiloForm" class="grid grid-cols-12 gap-4 border-b pb-4 border-surface-200" (ngSubmit)="guardarEstilo()">
                        <div class="col-span-12 md:col-span-4">
                            <label class="block mb-2 font-medium">Nombre de Estilo</label>
                            <input pInputText formControlName="nombre" class="w-full" placeholder="Ej: Rojo / Malla" />
                        </div>
                        <div class="col-span-12 md:col-span-8">
                            <label class="block mb-2 font-medium">Descripción</label>
                            <input pInputText formControlName="descripcion" class="w-full" />
                        </div>
                        <div class="col-span-12 md:col-span-10">
                            <label class="block mb-2 font-medium">URL de Imagen</label>
                            <input pInputText formControlName="urlImagenReferencia" class="w-full" placeholder="https://..." />
                        </div>
                        <div class="col-span-12 md:col-span-2 flex items-end">
                            <p-button type="submit" label="Agregar" icon="pi pi-plus" [loading]="savingEstilo()" class="w-full" styleClass="w-full"></p-button>
                        </div>
                    </form>

                    <p-table [value]="estilos()" dataKey="id" [loading]="loadingEstilos()" [rows]="5" [paginator]="true">
                        <ng-template #header>
                            <tr>
                                <th style="width: 5rem">Imagen</th>
                                <th>Nombre</th>
                                <th>Descripción</th>
                            </tr>
                        </ng-template>
                        <ng-template #body let-estilo>
                            <tr>
                                <td>
                                    <img [src]="estilo.urlImagenReferencia || 'demo/images/product/product-placeholder.svg'" alt="Estilo" width="46" class="border-round shadow-sm" />
                                </td>
                                <td class="font-medium">{{ estilo.nombre }}</td>
                                <td>{{ estilo.descripcion }}</td>
                            </tr>
                        </ng-template>
                        <ng-template #emptymessage>
                            <tr>
                                <td colspan="3">No hay estilos asignados a este producto.</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class CatalogoProductos implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly catalogoService = inject(CatalogoService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    // ─── State ───
    productos = signal<ProductoCatalogo[]>([]);
    estilos = signal<EstiloCatalogo[]>([]);
    lineasColeccion = signal<LineaColeccion[]>([]);
    seriesCatalogo = signal<Serie[]>([]);
    previewByProductoId = signal<Record<string, string>>({});
    
    // ─── Loaders ───
    loadingProductos = signal<boolean>(false);
    loadingEstilos = signal<boolean>(false);
    savingProducto = signal<boolean>(false);
    savingEstilo = signal<boolean>(false);
    
    // ─── Dialogs Visibility ───
    productoDialog = false;
    estilosDialog = false;

    // ─── Selected Items ───
    productoEditandoId = signal<string>('');
    productoSeleccionadoId = signal<string>('');
    productoSeleccionadoModelo = signal<string>('');

    // ─── Filters ───
    filtroActivo: string = 'activos';
    filtroDivision: string | null = null;
    filtroSearch: string = '';

    estadoFiltroOptions = [
        { value: 'todos', label: 'Todos' },
        { value: 'activos', label: 'Solo activos' },
        { value: 'inactivos', label: 'Solo inactivos' }
    ];

    divisionOptions = [
        { label: 'Guante', value: 'Guante' },
        { label: 'Fitness', value: 'Fitness' },
        { label: 'Mochila', value: 'Mochila' },
        { label: 'Cono', value: 'Cono' },
        { label: 'Espinillera', value: 'Espinillera' },
        { label: 'Accesorio', value: 'Accesorio' },
        { label: 'Textil', value: 'Textil' }
    ];

    // ─── Forms ───
    productoForm = this.fb.nonNullable.group({
        modelo: ['', Validators.required],
        division: ['Guante', Validators.required],
        idSerieCatalogo: ['', Validators.required],
        idLineaColeccion: [''],
        gama: [''],
        hsCode: [''],
        idEstado: [1, [Validators.required, Validators.min(1)]],
        activo: [true]
    });

    lineaColeccionOptions = computed(() =>
        this.lineasColeccion().map((l) => ({ value: l.id, label: `${l.codigo} - ${l.nombre}` }))
    );

    seriesOptions = computed(() =>
        this.seriesCatalogo().map((s) => ({ value: s.id, label: `${s.codigo} - ${s.nombre}` }))
    );

    estiloForm = this.fb.nonNullable.group({
        nombre: ['', Validators.required],
        descripcion: [''],
        urlImagenReferencia: ['']
    });

    ngOnInit(): void {
        this.cargarProductos();
        this.cargarLineasColeccion();
        this.cargarSeries();
    }

    onGlobalFilter(table: Table, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    // ═══ PRODUCTOS ═══

    cargarProductos(): void {
        this.loadingProductos.set(true);
        const query: GetProductosCatalogoQuery = {
            activo: this.mapEstadoFiltro(this.filtroActivo),
            division: this.filtroDivision || undefined,
            search: this.filtroSearch || undefined
        };

        this.catalogoService.getProductos(query).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                this.productos.set(response);
                this.loadingProductos.set(false);
            },
            error: (e: HttpErrorResponse) => {
                this.loadingProductos.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: `No se pudo cargar el catálogo de productos (${e.status || 0}).`, life: 5000 });
            }
        });
    }

    cargarLineasColeccion(): void {
        this.catalogoService.getLineasColeccion({ activo: true }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => this.lineasColeccion.set(data),
            error: () => this.messageService.add({ severity: 'error', summary: 'Aviso', detail: 'No se pudieron cargar las líneas de colección', life: 3000 })
        });
    }

    cargarSeries(): void {
        this.catalogoService.getSeries({ activo: true }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => this.seriesCatalogo.set(data),
            error: () => this.messageService.add({ severity: 'error', summary: 'Aviso', detail: 'No se pudieron cargar las series', life: 3000 })
        });
    }

    abrirNuevo(): void {
        this.productoEditandoId.set('');
        this.productoForm.reset({
            modelo: '',
            division: 'Guante',
            idSerieCatalogo: '',
            idLineaColeccion: '',
            gama: '',
            hsCode: '',
            idEstado: 1,
            activo: true
        });
        this.productoForm.markAsUntouched();
        this.productoDialog = true;
    }

    editarProducto(producto: ProductoCatalogo): void {
        this.productoEditandoId.set(producto.id);
        this.productoForm.reset({
            modelo: producto.modelo,
            division: producto.division,
            idSerieCatalogo: producto.idSerieCatalogo ?? '',
            idLineaColeccion: producto.idLineaColeccion ?? '',
            gama: '',
            hsCode: '',
            idEstado: producto.idEstado,
            activo: producto.activo
        });
        this.productoDialog = true;
    }

    eliminarProducto(producto: ProductoCatalogo): void {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar el producto <b>${producto.modelo}</b>?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                // TODO: Si el backend tiene un DELETE de producto físico, iría aquí. 
                // Por ahora simulamos una actualización donde activo = false
                const payload: CrearProductoCatalogoRequest = {
                    modelo: producto.modelo,
                    division: producto.division,
                    idSerieCatalogo: producto.idSerieCatalogo ?? null,
                    idLineaColeccion: producto.idLineaColeccion ?? null,
                    gama: '',
                    hsCode: '',
                    idEstado: producto.idEstado,
                    activo: false
                };

                this.catalogoService.actualizarProducto(producto.id, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargarProductos();
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'El producto fue desactivado/eliminado correctamente.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el producto.', life: 5000 });
                    }
                });
            }
        });
    }

    guardarProducto(): void {
        if (this.productoForm.invalid) {
            this.productoForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Formulario Incompleto', detail: 'Por favor completa los campos requeridos.', life: 4000 });

            return;
        }

        this.savingProducto.set(true);
        const raw = this.productoForm.getRawValue();
        const payload: CrearProductoCatalogoRequest = { ...raw, idSerieCatalogo: raw.idSerieCatalogo || null, idLineaColeccion: raw.idLineaColeccion || null, gama: raw.gama || '', hsCode: raw.hsCode || '' };
        const id = this.productoEditandoId();

        const request$ = id
            ? this.catalogoService.actualizarProducto(id, payload)
            : this.catalogoService.crearProducto(payload);

        request$.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.savingProducto.set(false);
                this.productoDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: id ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.', life: 3000 });
                this.cargarProductos();
            },
            error: () => {
                this.savingProducto.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un problema al guardar el producto.', life: 5000 });
            }
        });
    }

    // ═══ ESTILOS ═══

    abrirEstilos(producto: ProductoCatalogo): void {
        this.productoSeleccionadoId.set(producto.id);
        this.productoSeleccionadoModelo.set(producto.modelo);
        this.estiloForm.reset({ nombre: '', descripcion: '', urlImagenReferencia: '' });
        this.cargarEstilos(producto.id);
        this.estilosDialog = true;
    }

    cargarEstilos(idProducto: string): void {
        this.loadingEstilos.set(true);
        this.catalogoService.getEstilosByProducto(idProducto).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                this.estilos.set(response);
                const firstImage = response.find((i) => !!i.urlImagenReferencia)?.urlImagenReferencia;

                if (firstImage) {
                    this.previewByProductoId.update((c) => ({ ...c, [idProducto]: firstImage }));
                }

                this.loadingEstilos.set(false);
            },
            error: () => {
                this.loadingEstilos.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los estilos.', life: 5000 });
            }
        });
    }

    guardarEstilo(): void {
        const idProducto = this.productoSeleccionadoId();

        if (!idProducto) {
            return;
        }

        if (this.estiloForm.invalid) {
            this.estiloForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Formulario Incompleto', detail: 'El nombre del estilo es obligatorio.', life: 4000 });

            return;
        }

        this.savingEstilo.set(true);
        const raw = this.estiloForm.getRawValue();
        const payload: CrearEstiloCatalogoRequest = {
            idProducto,
            nombre: raw.nombre,
            descripcion: raw.descripcion,
            urlImagenReferencia: raw.urlImagenReferencia
        };

        this.catalogoService.crearEstilo(payload).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.savingEstilo.set(false);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estilo agregado correctamente.', life: 3000 });
                this.estiloForm.reset({ nombre: '', descripcion: '', urlImagenReferencia: '' });
                this.cargarEstilos(idProducto);
            },
            error: () => {
                this.savingEstilo.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo agregar el estilo.', life: 5000 });
            }
        });
    }

    // ═══ HELPERS ═══

    private mapEstadoFiltro(value: string): boolean | undefined {
        if (value === 'activos') {
            return true;
        }

        if (value === 'inactivos') {
            return false;
        }

        return undefined;
    }
}
