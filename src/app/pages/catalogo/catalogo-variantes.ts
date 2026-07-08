
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
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
import { CheckboxModule } from 'primeng/checkbox';
import { CatalogoService } from '../service/catalogo.service';
import {
    CrearVarianteCatalogoRequest,
    EstiloCatalogo,
    GetVariantesCatalogoQuery,
    ProductoCatalogo,
    VarianteCatalogo
} from '../service/catalogo-api.types';

@Component({
    selector: 'p-catalogo-variantes',
    standalone: true,
    imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    CheckboxModule
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
                        <div class="font-semibold text-xl">Catálogo de Variantes</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Gestión de las variaciones (códigos, segmentos, colores) de cada producto.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nueva" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargar()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <!-- ═══ FILTROS AVANZADOS ═══ -->
            <div class="grid grid-cols-12 gap-4 mb-4">
                <div class="col-span-12 md:col-span-4">
                    <p-select
                        [(ngModel)]="filtroProducto"
                        [ngModelOptions]="{ standalone: true }"
                        [options]="productoOptions()"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                        [filter]="true"
                        placeholder="Filtrar por Producto..."
                        (ngModelChange)="onFiltroProductoChange($event)"
                    ></p-select>
                </div>
                <div class="col-span-12 md:col-span-4">
                    <p-select
                        [(ngModel)]="filtroEstilo"
                        [ngModelOptions]="{ standalone: true }"
                        [options]="estiloFiltroOptions()"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                        [filter]="true"
                        placeholder="Filtrar por Estilo..."
                        [disabled]="!filtroProducto"
                    ></p-select>
                </div>
                <div class="col-span-12 md:col-span-2">
                    <p-select
                        [(ngModel)]="filtroActivo"
                        [ngModelOptions]="{ standalone: true }"
                        [options]="estadoOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                        placeholder="Estado"
                    ></p-select>
                </div>
                <div class="col-span-12 md:col-span-2 flex items-end">
                    <p-button label="Consultar" icon="pi pi-search" severity="secondary" (onClick)="cargar()" class="w-full" styleClass="w-full"></p-button>
                </div>
            </div>

            <!-- ═══ TABLA VARIANTES ═══ -->
            <p-table 
                #dt 
                [value]="variantes()" 
                dataKey="id" 
                [loading]="loading()" 
                [paginator]="true" 
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                [globalFilterFields]="['modeloProducto', 'nombreEstilo', 'segmento', 'colorNombre', 'itemCode']"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} variantes"
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
                        <th pSortableColumn="modeloProducto">Producto <p-sortIcon field="modeloProducto" /></th>
                        <th pSortableColumn="nombreEstilo">Estilo <p-sortIcon field="nombreEstilo" /></th>
                        <th pSortableColumn="segmento">Segmento <p-sortIcon field="segmento" /></th>
                        <th pSortableColumn="colorNombre">Color <p-sortIcon field="colorNombre" /></th>
                        <th pSortableColumn="itemCode">ItemCode <p-sortIcon field="itemCode" /></th>
                        <th pSortableColumn="activo">Estado <p-sortIcon field="activo" /></th>
                        <th style="min-width: 8rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-v>
                    <tr>
                        <td>
                            <img [src]="v.urlImagen || 'demo/images/product/product-placeholder.svg'" alt="Variante" width="46" class="border-round shadow-sm object-cover aspect-square" />
                        </td>
                        <td class="font-medium">{{ v.modeloProducto }}</td>
                        <td>{{ v.nombreEstilo }}</td>
                        <td>{{ v.segmento }}</td>
                        <td>{{ v.colorNombre }}</td>
                        <td><p-tag [value]="v.itemCode" severity="secondary" /></td>
                        <td><p-tag [value]="v.activo ? 'Activo' : 'Inactivo'" [severity]="v.activo ? 'success' : 'danger'" /></td>
                        <td>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editar(v)" pTooltip="Editar" />
                                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="eliminar(v)" pTooltip="Eliminar" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="8">No hay variantes registradas con los filtros actuales.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO VARIANTE (CREAR/EDITAR) ═══ -->
        <p-dialog [(visible)]="dialogVisible" [style]="{ width: '750px' }" [header]="editId() ? 'Editar Variante' : 'Crear Variante'" [modal]="true">
            <ng-template #content>
                <form [formGroup]="form" class="flex flex-col gap-6 mt-2 pb-2">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6">
                            <label for="idProducto" class="block font-bold mb-2">Producto</label>
                            <p-select id="idProducto" formControlName="idProducto" [options]="productoOptions()" optionLabel="label" optionValue="value" class="w-full" [filter]="true" (onChange)="onFormProductoChange($event.value)" fluid placeholder="Selecciona un Producto" appendTo="body"></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="idEstilo" class="block font-bold mb-2">Estilo</label>
                            <p-select id="idEstilo" formControlName="idEstilo" [options]="estiloFormOptions()" optionLabel="label" optionValue="value" class="w-full" [filter]="true" fluid placeholder="Selecciona un Estilo" appendTo="body"></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="segmento" class="block font-bold mb-2">Segmento</label>
                            <input pInputText id="segmento" formControlName="segmento" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="codigoCombinacion" class="block font-bold mb-2">Código Combinación</label>
                            <input pInputText id="codigoCombinacion" formControlName="codigoCombinacion" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="itemCode" class="block font-bold mb-2">ItemCode</label>
                            <input pInputText id="itemCode" formControlName="itemCode" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="colorNombre" class="block font-bold mb-2">Color</label>
                            <input pInputText id="colorNombre" formControlName="colorNombre" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="colorNombreEn" class="block font-bold mb-2">Color EN</label>
                            <input pInputText id="colorNombreEn" formControlName="colorNombreEn" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="rangoCorrida" class="block font-bold mb-2">Rango Corrida</label>
                            <input pInputText id="rangoCorrida" formControlName="rangoCorrida" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="codigoBarras" class="block font-bold mb-2">Código Barras</label>
                            <input pInputText id="codigoBarras" formControlName="codigoBarras" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="urlImagen" class="block font-bold mb-2">URL Imagen</label>
                            <input pInputText id="urlImagen" formControlName="urlImagen" fluid placeholder="https://..." />
                        </div>
                        <div class="col-span-12 flex items-center gap-2 mt-2">
                            <p-checkbox inputId="activo" formControlName="activo" [binary]="true" />
                            <label for="activo" class="font-bold">Activo</label>
                        </div>
                    </div>
                </form>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="dialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardar()" [loading]="saving()" />
            </ng-template>
        </p-dialog>
    `
})
export class CatalogoVariantes implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly catalogoService = inject(CatalogoService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    // ─── State ───
    productos = signal<ProductoCatalogo[]>([]);
    estilosFiltro = signal<EstiloCatalogo[]>([]);
    estilosForm = signal<EstiloCatalogo[]>([]);
    variantes = signal<VarianteCatalogo[]>([]);
    
    // ─── Loaders ───
    loading = signal(false);
    saving = signal(false);
    
    // ─── Dialog Visibility ───
    dialogVisible = false;
    editId = signal('');

    // ─── Filters ───
    filtroProducto = '';
    filtroEstilo = '';
    filtroActivo: string = 'activos';

    estadoOptions = [
        { value: 'todos', label: 'Todos' },
        { value: 'activos', label: 'Solo Activos' },
        { value: 'inactivos', label: 'Solo Inactivos' }
    ];

    // ─── Form ───
    form = this.fb.nonNullable.group({
        idProducto: ['', Validators.required],
        idEstilo: ['', Validators.required],
        segmento: ['Adulto', Validators.required],
        codigoCombinacion: ['', Validators.required],
        colorNombre: ['', Validators.required],
        colorNombreEn: [''],
        rangoCorrida: [''],
        urlImagen: [''],
        itemCode: ['', Validators.required],
        codigoBarras: [''],
        activo: [true, Validators.required]
    });

    productoOptions = computed(() =>
        this.productos().map((p) => ({ value: p.id, label: `${p.modelo} (${p.division})` }))
    );

    estiloFiltroOptions = computed(() =>
        this.estilosFiltro().map((e) => ({ value: e.id, label: e.nombre }))
    );

    estiloFormOptions = computed(() =>
        this.estilosForm().map((e) => ({ value: e.id, label: e.nombre }))
    );

    ngOnInit(): void {
        this.form.controls.idEstilo.disable();
        this.catalogoService.getProductos({ activo: true }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => this.productos.set(r)
        });
        this.cargar();
    }

    onGlobalFilter(table: Table, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    // ─── Dropdown Change Handlers ───

    onFiltroProductoChange(idProducto: string): void {
        this.filtroEstilo = '';

        if (!idProducto) {
            this.estilosFiltro.set([]);

            return;
        }

        this.catalogoService.getEstilosByProducto(idProducto).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => this.estilosFiltro.set(r),
            error: () => this.estilosFiltro.set([])
        });
    }

    onFormProductoChange(idProducto: string): void {
        this.form.patchValue({ idEstilo: '' });

        if (!idProducto) {
            this.estilosForm.set([]);
            this.form.controls.idEstilo.disable();

            return;
        }

        this.form.controls.idEstilo.enable();
        this.catalogoService.getEstilosByProducto(idProducto).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => this.estilosForm.set(r),
            error: () => this.estilosForm.set([])
        });
    }

    // ─── CRUD Actions ───

    cargar(): void {
        this.loading.set(true);

        const query: GetVariantesCatalogoQuery = {
            idProducto: this.filtroProducto || undefined,
            idEstilo: this.filtroEstilo || undefined,
            activo: this.filtroActivo === 'todos' ? undefined : this.filtroActivo === 'activos'
        };

        this.catalogoService.getVariantes(query).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => {
                this.variantes.set(r);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las variantes.', life: 5000 });
            }
        });
    }

    abrirNuevo(): void {
        this.limpiar();
        this.dialogVisible = true;
    }

    editar(v: VarianteCatalogo): void {
        this.editId.set(v.id);
        this.onFormProductoChange(v.idProducto);
        this.form.reset({
            idProducto: v.idProducto,
            idEstilo: v.idEstilo,
            segmento: v.segmento,
            codigoCombinacion: v.codigoCombinacion,
            colorNombre: v.colorNombre,
            colorNombreEn: v.colorNombreEn ?? '',
            rangoCorrida: v.rangoCorrida ?? '',
            urlImagen: v.urlImagen ?? '',
            itemCode: v.itemCode,
            codigoBarras: v.codigoBarras ?? '',
            activo: v.activo
        });
        this.dialogVisible = true;
    }

    eliminar(v: VarianteCatalogo): void {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar la variante <b>${v.itemCode} (${v.colorNombre})</b>?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                // Simular borrado marcando como inactivo
                const payload = {
                    idEstilo: v.idEstilo,
                    segmento: v.segmento,
                    codigoCombinacion: v.codigoCombinacion,
                    colorNombre: v.colorNombre,
                    colorNombreEn: v.colorNombreEn ?? '',
                    rangoCorrida: v.rangoCorrida ?? '',
                    urlImagen: v.urlImagen ?? '',
                    itemCode: v.itemCode,
                    codigoBarras: v.codigoBarras ?? '',
                    activo: false
                };

                this.catalogoService.actualizarVariante(v.id, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargar();
                        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'La variante fue desactivada/eliminada correctamente.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la variante.', life: 5000 });
                    }
                });
            }
        });
    }

    guardar(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Formulario Incompleto', detail: 'Por favor completa los campos requeridos.', life: 4000 });


            return;
        }

        this.saving.set(true);
        const raw = this.form.getRawValue();
        const createPayload: CrearVarianteCatalogoRequest = { ...raw };

        const req$ = this.editId()
            ? this.catalogoService.actualizarVariante(this.editId(), {
                  idEstilo: raw.idEstilo,
                  segmento: raw.segmento,
                  codigoCombinacion: raw.codigoCombinacion,
                  colorNombre: raw.colorNombre,
                  colorNombreEn: raw.colorNombreEn,
                  rangoCorrida: raw.rangoCorrida,
                  urlImagen: raw.urlImagen,
                  itemCode: raw.itemCode,
                  codigoBarras: raw.codigoBarras,
                  activo: raw.activo
              })
            : this.catalogoService.crearVariante(createPayload);

        req$.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.saving.set(false);
                this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.editId() ? 'Variante actualizada correctamente.' : 'Variante creada correctamente.', life: 3000 });
                this.cargar();
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la variante.', life: 5000 });
            }
        });
    }

    limpiar(): void {
        this.editId.set('');
        this.estilosForm.set([]);
        this.form.reset({
            idProducto: '',
            idEstilo: '',
            segmento: 'Adulto',
            codigoCombinacion: '',
            colorNombre: '',
            colorNombreEn: '',
            rangoCorrida: '',
            urlImagen: '',
            itemCode: '',
            codigoBarras: '',
            activo: true
        });
        this.form.markAsUntouched();
        this.form.controls.idEstilo.disable();
    }
}
