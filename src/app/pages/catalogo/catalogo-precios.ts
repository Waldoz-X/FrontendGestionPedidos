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
import { Cliente } from '../service/clientes/clientes-api.types';
import { ClientesApiService } from '../service/clientes/clientes-api.service';
import { CatalogoService } from '../service/catalogo.service';
import {
    CrearPoliticaPrecioRequest,
    CrearPrecioRequest,
    PoliticaPrecio,
    PrecioCatalogo,
    ProductoCatalogo,
    SkuCatalogo,
    VarianteCatalogo
} from '../service/catalogo-api.types';

@Component({
    selector: 'p-catalogo-precios',
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

        <div class="card mb-6">
            <!-- ═══ TOOLBAR POLITICAS ═══ -->
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Políticas de Precios</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Define los diferentes niveles de precios y factores base.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nueva Política" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirPoliticaNueva()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarPoliticas()" [loading]="loadingPoliticas()" />
                </ng-template>
            </p-toolbar>

            <!-- ═══ TABLA POLITICAS ═══ -->
            <p-table [value]="politicas()" dataKey="id" [loading]="loadingPoliticas()" [paginator]="true" [rows]="5" [rowHover]="true">
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="nombre">Nombre <p-sortIcon field="nombre" /></th>
                        <th pSortableColumn="tipo">Tipo <p-sortIcon field="tipo" /></th>
                        <th pSortableColumn="prioridad">Prioridad <p-sortIcon field="prioridad" /></th>
                        <th pSortableColumn="factorDescuento">Factor <p-sortIcon field="factorDescuento" /></th>
                        <th pSortableColumn="activo">Estado <p-sortIcon field="activo" /></th>
                        <th style="min-width: 8rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-p>
                    <tr>
                        <td class="font-medium">{{ p.nombre }}</td>
                        <td><p-tag severity="info" [value]="p.tipo" /></td>
                        <td>{{ p.prioridad }}</td>
                        <td class="font-bold text-primary">{{ p.factorDescuento }}</td>
                        <td><p-tag [value]="p.activo ? 'Activa' : 'Inactiva'" [severity]="p.activo ? 'success' : 'danger'" /></td>
                        <td>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editarPolitica(p)" pTooltip="Editar" />
                                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="eliminarPolitica(p)" pTooltip="Eliminar" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr><td colspan="6">No hay políticas configuradas.</td></tr>
                </ng-template>
            </p-table>
        </div>

        <div class="card">
            <!-- ═══ TOOLBAR PRECIOS ═══ -->
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Precios por SKU</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Asignación de precio final usando SKU, Cliente (opcional) y Política.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nuevo Precio" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirPrecioNuevo()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarPrecios()" [loading]="loadingPrecios()" />
                </ng-template>
            </p-toolbar>

            <!-- ═══ FILTROS AVANZADOS PRECIOS ═══ -->
            <div class="grid grid-cols-12 gap-4 mb-4">
                <div class="col-span-12 md:col-span-3">
                    <p-select [(ngModel)]="filtroProducto" [ngModelOptions]="{ standalone: true }" [options]="productoOptions()" optionLabel="label" optionValue="value" [filter]="true" class="w-full" placeholder="Filtrar por Producto..." (ngModelChange)="onFiltroProductoChange($event)"></p-select>
                </div>
                <div class="col-span-12 md:col-span-3">
                    <p-select [(ngModel)]="filtroVariante" [ngModelOptions]="{ standalone: true }" [options]="varianteFiltroOptions()" optionLabel="label" optionValue="value" [filter]="true" class="w-full" placeholder="Filtrar por Variante..." [disabled]="!filtroProducto" (ngModelChange)="onFiltroVarianteChange($event)"></p-select>
                </div>
                <div class="col-span-12 md:col-span-3">
                    <p-select [(ngModel)]="filtroSku" [ngModelOptions]="{ standalone: true }" [options]="skuFiltroOptions()" optionLabel="label" optionValue="value" [filter]="true" class="w-full" placeholder="Filtrar por SKU..." [disabled]="!filtroVariante"></p-select>
                </div>
                <div class="col-span-12 md:col-span-3">
                    <p-select [(ngModel)]="filtroCliente" [ngModelOptions]="{ standalone: true }" [options]="clienteOptions()" optionLabel="label" optionValue="value" [filter]="true" class="w-full" placeholder="Filtrar por Cliente..."></p-select>
                </div>
                <div class="col-span-12 flex justify-end mt-2">
                    <p-button label="Consultar" icon="pi pi-search" severity="secondary" (onClick)="cargarPrecios()"></p-button>
                </div>
            </div>

            <!-- ═══ TABLA PRECIOS ═══ -->
            <p-table 
                #dt 
                [value]="precios()" 
                dataKey="id" 
                [loading]="loadingPrecios()" 
                [paginator]="true" 
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                [globalFilterFields]="['idSku', 'nombrePolitica', 'moneda']"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} precios"
                [showCurrentPageReport]="true"
                [rowHover]="true">
                
                <ng-template #caption>
                    <div class="flex items-center justify-between">
                        <span></span>
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search" />
                            <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar precios..." />
                        </p-iconfield>
                    </div>
                </ng-template>

                <ng-template #header>
                    <tr>
                        <th style="min-width: 18rem">Producto / Var / Talla</th>
                        <th pSortableColumn="idSku">SKU <p-sortIcon field="idSku" /></th>
                        <th pSortableColumn="nombrePolitica">Política <p-sortIcon field="nombrePolitica" /></th>
                        <th pSortableColumn="moneda">Mda <p-sortIcon field="moneda" /></th>
                        <th pSortableColumn="precioNeto">Precio N. <p-sortIcon field="precioNeto" /></th>
                        <th pSortableColumn="activo">Estado <p-sortIcon field="activo" /></th>
                        <th style="min-width: 8rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-pr>
                    <tr>
                        <td class="font-medium text-sm">{{ skuLegible(pr.idSku) }}</td>
                        <td class="text-xs text-surface-500">{{ pr.idSku }}</td>
                        <td><p-tag severity="info" [value]="pr.nombrePolitica" /></td>
                        <td class="font-bold">{{ pr.moneda }}</td>
                        <td class="font-bold text-green-600 dark:text-green-400">\${{ pr.precioNeto | number:'1.2-2' }}</td>
                        <td><p-tag [value]="pr.activo ? 'Activo' : 'Inactivo'" [severity]="pr.activo ? 'success' : 'danger'" /></td>
                        <td>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editarPrecio(pr)" pTooltip="Editar" />
                                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="eliminarPrecio(pr)" pTooltip="Eliminar" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr><td colspan="7">No hay precios configurados para esta consulta.</td></tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO POLITICA (CREAR/EDITAR) ═══ -->
        <p-dialog [(visible)]="dialogPolitica" [style]="{ width: '600px' }" [header]="editPoliticaId() ? 'Editar Política' : 'Crear Política'" [modal]="true">
            <ng-template #content>
                <form [formGroup]="politicaForm" class="flex flex-col gap-6 mt-2 pb-2">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-8">
                            <label for="nombre" class="block font-bold mb-2">Nombre Política</label>
                            <input pInputText id="nombre" formControlName="nombre" fluid autofocus />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="tipo" class="block font-bold mb-2">Tipo</label>
                            <input pInputText id="tipo" formControlName="tipo" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="prioridad" class="block font-bold mb-2">Prioridad</label>
                            <input pInputText type="number" id="prioridad" formControlName="prioridad" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="factorDescuento" class="block font-bold mb-2">Factor Mult.</label>
                            <input pInputText type="number" step="0.0001" id="factorDescuento" formControlName="factorDescuento" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="vigenteDesde" class="block font-bold mb-2">Vigente Desde</label>
                            <input pInputText type="datetime-local" id="vigenteDesde" formControlName="vigenteDesde" fluid />
                        </div>
                        <div class="col-span-12 flex items-center gap-2 mt-2">
                            <p-checkbox inputId="activoPol" formControlName="activo" [binary]="true" />
                            <label for="activoPol" class="font-bold">Política Activa</label>
                        </div>
                    </div>
                </form>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="dialogPolitica = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarPolitica()" [loading]="savingPolitica()" />
            </ng-template>
        </p-dialog>

        <!-- ═══ DIALOGO PRECIO (CREAR/EDITAR) ═══ -->
        <p-dialog [(visible)]="dialogPrecio" [style]="{ width: '750px' }" [header]="editPrecioId() ? 'Editar Precio de SKU' : 'Añadir Precio a SKU'" [modal]="true">
            <ng-template #content>
                <form [formGroup]="precioForm" class="flex flex-col gap-6 mt-2 pb-2">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-4">
                            <label for="idProductoP" class="block font-bold mb-2">Producto</label>
                            <p-select id="idProductoP" formControlName="idProducto" [options]="productoOptions()" optionLabel="label" optionValue="value" [filter]="true" class="w-full" (onChange)="onFormProductoChange($event.value)" fluid appendTo="body" placeholder="Producto..."></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="idVarianteP" class="block font-bold mb-2">Variante</label>
                            <p-select id="idVarianteP" formControlName="idVariante" [options]="varianteFormOptions()" optionLabel="label" optionValue="value" [filter]="true" class="w-full" (onChange)="onFormVarianteChange($event.value)" fluid appendTo="body" placeholder="Variante..."></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="idSkuP" class="block font-bold mb-2">SKU</label>
                            <p-select id="idSkuP" formControlName="idSku" [options]="skuFormOptions()" optionLabel="label" optionValue="value" [filter]="true" class="w-full" fluid appendTo="body" placeholder="SKU Destino..."></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="idPolitica" class="block font-bold mb-2">Aplica Política</label>
                            <p-select id="idPolitica" formControlName="idPolitica" [options]="politicaOptions()" optionLabel="label" optionValue="value" class="w-full" fluid appendTo="body"></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="idCliente" class="block font-bold mb-2">Cliente Específico (Opcional)</label>
                            <p-select id="idCliente" formControlName="idCliente" [options]="clienteOptions()" optionLabel="label" optionValue="value" [filter]="true" class="w-full" fluid appendTo="body"></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="moneda" class="block font-bold mb-2">Moneda ISO</label>
                            <input pInputText id="moneda" formControlName="moneda" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="precioNeto" class="block font-bold mb-2">Precio Fijo</label>
                            <input pInputText type="number" step="0.01" id="precioNeto" formControlName="precioNeto" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-4">
                            <label for="vigenteDesdeP" class="block font-bold mb-2">Vigente Desde</label>
                            <input pInputText type="datetime-local" id="vigenteDesdeP" formControlName="vigenteDesde" fluid />
                        </div>
                        <div class="col-span-12 flex items-center gap-2 mt-2">
                            <p-checkbox inputId="activoPrecio" formControlName="activo" [binary]="true" />
                            <label for="activoPrecio" class="font-bold">Precio Activo</label>
                        </div>
                    </div>
                </form>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="dialogPrecio = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarPrecio()" [loading]="savingPrecio()" />
            </ng-template>
        </p-dialog>
    `
})
export class CatalogoPrecios implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly catalogoService = inject(CatalogoService);
    private readonly clientesService = inject(ClientesApiService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    // ─── Data State ───
    clientes = signal<Cliente[]>([]);
    politicas = signal<PoliticaPrecio[]>([]);
    precios = signal<PrecioCatalogo[]>([]);
    productos = signal<ProductoCatalogo[]>([]);
    variantesCatalogo = signal<VarianteCatalogo[]>([]);
    skusCatalogo = signal<SkuCatalogo[]>([]);
    
    // ─── Filter Form Sets ───
    variantesFiltro = signal<VarianteCatalogo[]>([]);
    skusFiltro = signal<SkuCatalogo[]>([]);
    variantesForm = signal<VarianteCatalogo[]>([]);
    skusForm = signal<SkuCatalogo[]>([]);

    // ─── UI Status ───
    loadingPoliticas = signal(false);
    loadingPrecios = signal(false);
    savingPolitica = signal(false);
    savingPrecio = signal(false);
    
    // ─── Modal Visibilities ───
    dialogPolitica = false;
    dialogPrecio = false;
    editPoliticaId = signal('');
    editPrecioId = signal('');

    // ─── Filters ───
    filtroProducto = '';
    filtroVariante = '';
    filtroSku = '';
    filtroCliente = '';

    // ─── Forms ───
    politicaForm = this.fb.nonNullable.group({
        nombre: ['', Validators.required],
        tipo: ['BaseSegmento', Validators.required],
        prioridad: [100, Validators.required],
        factorDescuento: [1, Validators.required],
        vigenteDesde: ['', Validators.required],
        vigenteHasta: [''],
        activo: [true]
    });

    precioForm = this.fb.nonNullable.group({
        idProducto: ['', Validators.required],
        idVariante: ['', Validators.required],
        idSku: ['', Validators.required],
        idPolitica: ['', Validators.required],
        idCliente: [''],
        moneda: ['MXN', Validators.required],
        precioNeto: [0, Validators.required],
        vigenteDesde: ['', Validators.required],
        vigenteHasta: [''],
        activo: [true]
    });

    // ─── Computed Mappers ───
    productoOptions = computed(() =>
        this.productos().map((p) => ({ value: p.id, label: `${p.modelo} (${p.division})` }))
    );
    varianteFiltroOptions = computed(() =>
        this.variantesFiltro().map((v) => ({ value: v.id, label: `${v.nombreEstilo} - ${v.colorNombre}` }))
    );
    skuFiltroOptions = computed(() =>
        this.skusFiltro().map((s) => ({ value: s.id, label: `${s.etiquetaTalla}` }))
    );
    varianteFormOptions = computed(() =>
        this.variantesForm().map((v) => ({ value: v.id, label: `${v.nombreEstilo} - ${v.colorNombre}` }))
    );
    skuFormOptions = computed(() =>
        this.skusForm().map((s) => ({ value: s.id, label: `${s.etiquetaTalla} (Neto: ${s.stockNeto})` }))
    );
    politicaOptions = computed(() =>
        this.politicas().map((p) => ({ value: p.id, label: p.nombre }))
    );
    clienteOptions = computed(() =>
        [{ value: '', label: '-- General (Aplica a todos) --' }, ...this.clientes().map((c) => ({ value: c.id, label: c.nombreComercial }))]
    );

    ngOnInit(): void {
        this.precioForm.controls.idVariante.disable();
        this.precioForm.controls.idSku.disable();
        this.cargarPoliticas();
        this.cargarPrecios();

        this.catalogoService.getProductos({ activo: true }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (r) => this.productos.set(r) });
        this.catalogoService.getVariantes({}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (r) => this.variantesCatalogo.set(r) });
        this.catalogoService.getSkus({}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (r) => this.skusCatalogo.set(r) });
        this.clientesService.getClientes({ activo: true }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (r) => this.clientes.set(r) });
    }

    onGlobalFilter(table: Table, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    skuLegible(idSku: string): string {
        const sku = this.skusCatalogo().find((item) => item.id === idSku);

        if (!sku) {
            return 'SKU no referenciado localmente';
        }

        const variante = this.variantesCatalogo().find((item) => item.id === sku.idVariante);
        const etiquetaVariante = variante ? `${variante.nombreEstilo} - ${variante.colorNombre}` : `Variante ${sku.idVariante.slice(0, 8)}`;

        return `${sku.modeloProducto} - ${etiquetaVariante} / ${sku.etiquetaTalla}`;
    }

    // ─── Filter Dynamic Selects ───

    onFiltroProductoChange(idProducto: string): void {
        this.filtroVariante = '';
        this.filtroSku = '';
        this.skusFiltro.set([]);

        if (!idProducto) {
            this.variantesFiltro.set([]);

            return;
        }

        this.catalogoService.getVariantes({ idProducto, activo: true }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (r) => this.variantesFiltro.set(r),
            error: () => this.variantesFiltro.set([])
        });
    }

    onFiltroVarianteChange(idVariante: string): void {
        this.filtroSku = '';

        if (!idVariante) {
            this.skusFiltro.set([]);

            return;
        }

        this.catalogoService.getSkus({ idVariante, activo: true }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (r) => this.skusFiltro.set(r),
            error: () => this.skusFiltro.set([])
        });
    }

    onFormProductoChange(idProducto: string): void {
        this.precioForm.patchValue({ idVariante: '', idSku: '' });
        this.skusForm.set([]);
        this.precioForm.controls.idSku.disable();

        if (!idProducto) {
            this.variantesForm.set([]);
            this.precioForm.controls.idVariante.disable();

            return;
        }

        this.precioForm.controls.idVariante.enable();
        this.catalogoService.getVariantes({ idProducto, activo: true }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (r) => this.variantesForm.set(r),
            error: () => { this.variantesForm.set([]); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo red variante' }); }
        });
    }

    onFormVarianteChange(idVariante: string): void {
        this.precioForm.patchValue({ idSku: '' });

        if (!idVariante) {
            this.skusForm.set([]);
            this.precioForm.controls.idSku.disable();

            return;
        }

        this.precioForm.controls.idSku.enable();
        this.catalogoService.getSkus({ idVariante, activo: true }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (r) => this.skusForm.set(r),
            error: () => { this.skusForm.set([]); this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Fallo red skus' }); }
        });
    }

    // ─── POLITICAS Actions ───

    cargarPoliticas(): void {
        this.loadingPoliticas.set(true);
        this.catalogoService.getPoliticas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (r) => { this.politicas.set(r); this.loadingPoliticas.set(false); },
            error: () => this.loadingPoliticas.set(false)
        });
    }

    abrirPoliticaNueva(): void {
        this.editPoliticaId.set('');
        this.politicaForm.reset({
            nombre: '',
            tipo: 'BaseSegmento',
            prioridad: 100,
            factorDescuento: 1,
            vigenteDesde: '',
            vigenteHasta: '',
            activo: true
        });
        this.politicaForm.markAsUntouched();
        this.dialogPolitica = true;
    }

    editarPolitica(p: PoliticaPrecio): void {
        this.editPoliticaId.set(p.id);
        this.politicaForm.reset({
            nombre: p.nombre,
            tipo: p.tipo,
            prioridad: p.prioridad,
            factorDescuento: p.factorDescuento,
            vigenteDesde: this.toLocal(p.vigenteDesde),
            vigenteHasta: this.toLocal(p.vigenteHasta),
            activo: p.activo
        });
        this.dialogPolitica = true;
    }

    eliminarPolitica(p: PoliticaPrecio): void {
        this.confirmationService.confirm({
            message: `¿Desactivar la política de precios <b>${p.nombre}</b>?`,
            header: 'Confirmar Acción',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, Desactivar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const payload: CrearPoliticaPrecioRequest = {
                    nombre: p.nombre,
                    tipo: p.tipo,
                    prioridad: p.prioridad,
                    factorDescuento: p.factorDescuento,
                    vigenteDesde: p.vigenteDesde,
                    vigenteHasta: p.vigenteHasta,
                    activo: false
                };

                this.catalogoService.actualizarPolitica(p.id, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargarPoliticas();
                        this.messageService.add({ severity: 'success', summary: 'Desactivado', detail: 'La política ha sido desactivada.', life: 3000 });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo alterar la política.', life: 4000 })
                });
            }
        });
    }

    guardarPolitica(): void {
        if (this.politicaForm.invalid) {
            this.politicaForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Faltan Campos', detail: 'Formulario de política incompleto.' });

            return;
        }

        this.savingPolitica.set(true);
        const raw = this.politicaForm.getRawValue();
        const payload: CrearPoliticaPrecioRequest = {
            ...raw,
            vigenteHasta: raw.vigenteHasta || null
        };

        const req$ = this.editPoliticaId()
            ? this.catalogoService.actualizarPolitica(this.editPoliticaId(), payload)
            : this.catalogoService.crearPolitica(payload);

        req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.savingPolitica.set(false);
                this.dialogPolitica = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Política Registrada' });
                this.cargarPoliticas();
            },
            error: () => {
                this.savingPolitica.set(false);
                this.messageService.add({ severity: 'error', summary: 'Alerta', detail: 'Problema al guardar Política.' });
            }
        });
    }

    // ─── PRECIOS Actions ───

    cargarPrecios(): void {
        this.loadingPrecios.set(true);
        this.catalogoService.getPrecios({
            idSku: this.filtroSku || undefined,
            idCliente: this.filtroCliente || undefined
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (r) => { this.precios.set(r); this.loadingPrecios.set(false); },
            error: () => this.loadingPrecios.set(false)
        });
    }

    abrirPrecioNuevo(): void {
        this.editPrecioId.set('');
        this.variantesForm.set([]);
        this.skusForm.set([]);
        this.precioForm.reset({
            idProducto: '',
            idVariante: '',
            idSku: '',
            idPolitica: '',
            idCliente: '',
            moneda: 'MXN',
            precioNeto: 0,
            vigenteDesde: '',
            vigenteHasta: '',
            activo: true
        });
        this.precioForm.markAsUntouched();
        this.precioForm.controls.idVariante.disable();
        this.precioForm.controls.idSku.disable();
        this.dialogPrecio = true;
    }

    editarPrecio(pr: PrecioCatalogo): void {
        this.editPrecioId.set(pr.id);
        const sku = this.skusCatalogo().find((item) => item.id === pr.idSku);

        if (!sku) {
            this.messageService.add({ severity: 'warn', summary: 'Fallo Referencia', detail: 'SKU no ubicado en catálogo vivo.' });

            return;
        }

        // Cascada reversa
        this.catalogoService.getVariantes({ idProducto: sku.idProducto }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (variantes) => {
                this.variantesForm.set(variantes);
                const variante = variantes.find((v) => v.id === sku.idVariante);

                this.catalogoService.getSkus({ idVariante: sku.idVariante }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: (skus) => {
                        this.skusForm.set(skus);
                        this.precioForm.controls.idVariante.enable();
                        this.precioForm.controls.idSku.enable();
                        this.precioForm.reset({
                            idProducto: sku.idProducto,
                            idVariante: variante?.id || sku.idVariante,
                            idSku: sku.id,
                            idPolitica: pr.idPolitica,
                            idCliente: pr.idCliente || '',
                            moneda: pr.moneda,
                            precioNeto: pr.precioNeto,
                            vigenteDesde: this.toLocal(pr.vigenteDesde),
                            vigenteHasta: this.toLocal(pr.vigenteHasta),
                            activo: pr.activo
                        });
                        this.dialogPrecio = true;
                    }
                });
            }
        });
    }

    eliminarPrecio(pr: PrecioCatalogo): void {
        this.confirmationService.confirm({
            message: `¿Desactivar/Remover esta asignación de precio de valor $${pr.precioNeto}?`,
            header: 'Confirmar Acción',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, Desactivar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const payload: CrearPrecioRequest = {
                    idSku: pr.idSku,
                    idPolitica: pr.idPolitica,
                    idCliente: pr.idCliente,
                    moneda: pr.moneda,
                    precioNeto: pr.precioNeto,
                    vigenteDesde: pr.vigenteDesde,
                    vigenteHasta: pr.vigenteHasta,
                    activo: false
                };

                this.catalogoService.actualizarPrecio(pr.id, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargarPrecios();
                        this.messageService.add({ severity: 'success', summary: 'Desactivado', detail: 'Precio removido.', life: 3000 });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo retirar el precio.', life: 4000 })
                });
            }
        });
    }

    guardarPrecio(): void {
        if (this.precioForm.invalid) {
            this.precioForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Faltan Campos', detail: 'Por favor complete todos los datos del precio.' });

            return;
        }

        this.savingPrecio.set(true);
        const raw = this.precioForm.getRawValue();
        const payload: CrearPrecioRequest = {
            idSku: raw.idSku,
            idPolitica: raw.idPolitica,
            idCliente: raw.idCliente || null,
            moneda: raw.moneda,
            precioNeto: raw.precioNeto,
            vigenteDesde: raw.vigenteDesde,
            vigenteHasta: raw.vigenteHasta || null,
            activo: raw.activo
        };

        const req$ = this.editPrecioId()
            ? this.catalogoService.actualizarPrecio(this.editPrecioId(), {
                  idPolitica: payload.idPolitica,
                  idCliente: payload.idCliente,
                  moneda: payload.moneda,
                  precioNeto: payload.precioNeto,
                  vigenteDesde: payload.vigenteDesde,
                  vigenteHasta: payload.vigenteHasta,
                  activo: payload.activo
              })
            : this.catalogoService.crearPrecio(payload);

        req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.savingPrecio.set(false);
                this.dialogPrecio = false;
                this.cargarPrecios();
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Precio registrado adecuadamente.' });
            },
            error: () => {
                this.savingPrecio.set(false);
                this.messageService.add({ severity: 'error', summary: 'Fallo al Grabar', detail: 'Problema en la BD de precios.' });
            }
        });
    }

    private toLocal(value: string | null): string {
        if (!value) {
            return '';
        }

        const d = new Date(value);

        if (Number.isNaN(d.getTime())) {
            return '';
        }

        const p = (n: number) => n.toString().padStart(2, '0');

        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    }
}
