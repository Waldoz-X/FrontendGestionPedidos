import { CommonModule } from '@angular/common';
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
    CrearSkuCatalogoRequest,
    GetSkusCatalogoQuery,
    ProductoCatalogo,
    SkuCatalogo,
    TallaCatalogo,
    VarianteCatalogo
} from '../service/catalogo-api.types';

@Component({
    selector: 'p-catalogo-skus',
    standalone: true,
    imports: [
        CommonModule,
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
                        <div class="font-semibold text-xl">Catálogo de SKUs</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Gestión de Stock units (SKU) por producto, variante y talla.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nuevo SKU" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
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
                        [(ngModel)]="filtroVariante"
                        [ngModelOptions]="{ standalone: true }"
                        [options]="varianteFiltroOptions()"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                        [filter]="true"
                        placeholder="Filtrar por Variante..."
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

            <!-- ═══ TABLA SKUs ═══ -->
            <p-table 
                #dt 
                [value]="skus()" 
                dataKey="id" 
                [loading]="loading()" 
                [paginator]="true" 
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                [globalFilterFields]="['modeloProducto', 'etiquetaTalla']"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} SKUs"
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
                        <th pSortableColumn="modeloProducto">Producto <p-sortIcon field="modeloProducto" /></th>
                        <th pSortableColumn="etiquetaTalla">Talla <p-sortIcon field="etiquetaTalla" /></th>
                        <th pSortableColumn="stockNeto">Stock Neto <p-sortIcon field="stockNeto" /></th>
                        <th pSortableColumn="activo">Estado <p-sortIcon field="activo" /></th>
                        <th style="min-width: 8rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-s>
                    <tr>
                        <td class="font-medium">{{ s.modeloProducto }}</td>
                        <td><p-tag severity="secondary" [value]="s.etiquetaTalla" /></td>
                        <td [ngClass]="{'text-red-500 font-bold': s.stockNeto <= 0, 'text-green-500 font-bold': s.stockNeto > 0}">{{ s.stockNeto }}</td>
                        <td><p-tag [value]="s.activo ? 'Activo' : 'Inactivo'" [severity]="s.activo ? 'success' : 'danger'" /></td>
                        <td>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editar(s)" pTooltip="Editar" />
                                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="eliminar(s)" pTooltip="Eliminar" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="5">No hay SKUs registrados con los filtros actuales.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO SKU (CREAR/EDITAR) ═══ -->
        <p-dialog [(visible)]="dialogVisible" [style]="{ width: '600px' }" [header]="editId() ? 'Editar SKU' : 'Crear SKU'" [modal]="true">
            <ng-template #content>
                <form [formGroup]="form" class="flex flex-col gap-6 mt-2 pb-2">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6">
                            <label for="idProducto" class="block font-bold mb-2">Producto</label>
                            <p-select id="idProducto" formControlName="idProducto" [options]="productoOptions()" optionLabel="label" optionValue="value" class="w-full" [filter]="true" (onChange)="onFormProductoChange($event.value)" fluid placeholder="Selecciona Producto" appendTo="body"></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="idVariante" class="block font-bold mb-2">Variante</label>
                            <p-select id="idVariante" formControlName="idVariante" [options]="varianteFormOptions()" optionLabel="label" optionValue="value" class="w-full" [filter]="true" fluid placeholder="Selecciona Variante" appendTo="body"></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="idTalla" class="block font-bold mb-2">Talla</label>
                            <p-select id="idTalla" formControlName="idTalla" [options]="tallaOptions()" optionLabel="label" optionValue="value" class="w-full" [filter]="true" fluid placeholder="Selecciona Talla" appendTo="body"></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-3">
                            <label for="stockDisponible" class="block font-bold mb-2">Stock Disp.</label>
                            <input pInputText type="number" id="stockDisponible" formControlName="stockDisponible" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-3">
                            <label for="stockReservado" class="block font-bold mb-2">Reservado</label>
                            <input pInputText type="number" id="stockReservado" formControlName="stockReservado" fluid />
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
export class CatalogoSkus implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly catalogoService = inject(CatalogoService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    // ─── State ───
    productos = signal<ProductoCatalogo[]>([]);
    variantesFiltro = signal<VarianteCatalogo[]>([]);
    variantesForm = signal<VarianteCatalogo[]>([]);
    tallas = signal<TallaCatalogo[]>([]);
    skus = signal<SkuCatalogo[]>([]);
    
    // ─── Loaders ───
    loading = signal(false);
    saving = signal(false);
    
    // ─── Dialog Visibility ───
    dialogVisible = false;
    editId = signal('');

    // ─── Filters ───
    filtroProducto = '';
    filtroVariante = '';
    filtroActivo = 'activos';

    estadoOptions = [
        { value: 'todos', label: 'Todos' },
        { value: 'activos', label: 'Solo Activos' },
        { value: 'inactivos', label: 'Solo Inactivos' }
    ];

    // ─── Form ───
    form = this.fb.nonNullable.group({
        idProducto: ['', Validators.required],
        idVariante: ['', Validators.required],
        idTalla: [0, [Validators.required, Validators.min(1)]],
        activo: [true, Validators.required],
        stockDisponible: [0, [Validators.required, Validators.min(0)]],
        stockReservado: [0, [Validators.required, Validators.min(0)]]
    });

    productoOptions = computed(() =>
        this.productos().map((p) => ({ value: p.id, label: `${p.modelo} (${p.division})` }))
    );

    varianteFiltroOptions = computed(() =>
        this.variantesFiltro().map((v) => ({ value: v.id, label: `${v.nombreEstilo} - ${v.colorNombre}` }))
    );

    varianteFormOptions = computed(() =>
        this.variantesForm().map((v) => ({ value: v.id, label: `${v.nombreEstilo} - ${v.colorNombre}` }))
    );

    tallaOptions = computed(() =>
        this.tallas().map((t) => ({ value: t.id, label: `${t.etiqueta} (${t.segmento})` }))
    );

    ngOnInit(): void {
        this.form.controls.idVariante.disable();
        this.catalogoService.getProductos({ activo: true }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({ next: (r) => this.productos.set(r) });

        this.catalogoService.getTallas(true).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({ next: (r) => this.tallas.set(r) });

        this.cargar();
    }

    onGlobalFilter(table: Table, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    // ─── Dropdown Change Handlers ───

    onFiltroProductoChange(idProducto: string): void {
        this.filtroVariante = '';

        if (!idProducto) {
            this.variantesFiltro.set([]);

            return;
        }

        this.catalogoService.getVariantes({ idProducto, activo: true }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => this.variantesFiltro.set(r),
            error: () => this.variantesFiltro.set([])
        });
    }

    onFormProductoChange(idProducto: string): void {
        this.form.patchValue({ idVariante: '' });

        if (!idProducto) {
            this.variantesForm.set([]);
            this.form.controls.idVariante.disable();

            return;
        }

        this.form.controls.idVariante.enable();
        this.catalogoService.getVariantes({ idProducto, activo: true }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => this.variantesForm.set(r),
            error: () => this.variantesForm.set([])
        });
    }

    // ─── CRUD Actions ───

    cargar(): void {
        this.loading.set(true);

        const query: GetSkusCatalogoQuery = {
            idProducto: this.filtroProducto || undefined,
            idVariante: this.filtroVariante || undefined,
            activo: this.filtroActivo === 'todos' ? undefined : this.filtroActivo === 'activos'
        };

        this.catalogoService.getSkus(query).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => {
                this.skus.set(r);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los SKUs.', life: 5000 });
            }
        });
    }

    abrirNuevo(): void {
        this.limpiar();
        this.dialogVisible = true;
    }

    editar(s: SkuCatalogo): void {
        this.editId.set(s.id);
        this.onFormProductoChange(s.idProducto);
        this.form.reset({
            idProducto: s.idProducto,
            idVariante: s.idVariante,
            idTalla: s.idTalla,
            activo: s.activo,
            stockDisponible: s.stockDisponible,
            stockReservado: s.stockReservado
        });
        this.dialogVisible = true;
    }

    eliminar(s: SkuCatalogo): void {
        this.confirmationService.confirm({
            message: `¿Estás seguro de desactivar el SKU para la talla <b>${s.etiquetaTalla}</b> del producto <b>${s.modeloProducto}</b>?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                // Simular borrado marcando como inactivo
                const payload = {
                    activo: false,
                    stockDisponible: s.stockDisponible,
                    stockReservado: s.stockReservado
                };

                this.catalogoService.actualizarSku(s.id, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargar();
                        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'El SKU fue desactivado correctamente.', life: 3000 });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el SKU.', life: 5000 });
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

        const raw = this.form.getRawValue();

        if (raw.stockReservado > raw.stockDisponible) {
            this.messageService.add({ severity: 'error', summary: 'Error de Stock', detail: 'El stock reservado no puede ser mayor al disponible.', life: 5000 });


            return;
        }

        this.saving.set(true);

        const req$ = this.editId()
            ? this.catalogoService.actualizarSku(this.editId(), {
                  activo: raw.activo,
                  stockDisponible: raw.stockDisponible,
                  stockReservado: raw.stockReservado
              })
            : this.catalogoService.crearSku({
                  idVariante: raw.idVariante,
                  idTalla: raw.idTalla,
                  activo: raw.activo,
                  stockDisponible: raw.stockDisponible,
                  stockReservado: raw.stockReservado
              } as CrearSkuCatalogoRequest);

        req$.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.saving.set(false);
                this.dialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.editId() ? 'SKU actualizado correctamente.' : 'SKU creado correctamente.', life: 3000 });
                this.cargar();
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el SKU.', life: 5000 });
            }
        });
    }

    limpiar(): void {
        this.editId.set('');
        this.variantesForm.set([]);
        this.form.reset({
            idProducto: '',
            idVariante: '',
            idTalla: 0,
            activo: true,
            stockDisponible: 0,
            stockReservado: 0
        });
        this.form.markAsUntouched();
        this.form.controls.idVariante.disable();
    }
}
