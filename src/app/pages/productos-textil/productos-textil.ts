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
import { FileUploadModule } from 'primeng/fileupload';

import { 
    ProductoTextil, 
    CrearProductoTextilRequest, 
    ActualizarProductoTextilRequest,
    VarianteNestedDtoTextil,
    SkuNestedDtoTextil
} from '../service/productos-textil/productos-textil-api.types';
import { ProductosTextilApiService } from '../service/productos-textil/productos-textil-api.service';
import { CatalogosApiService, CatalogoElemento } from '../service/catalogos-api.service';

@Component({
    selector: 'app-productos-textil',
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
        TabsModule,
        FileUploadModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <p-dialog 
            [(visible)]="bulkDialogVisible" 
            [style]="{ width: '500px' }" 
            header="Carga Masiva de Textils" 
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div class="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <i class="pi pi-info-circle text-blue-500 text-xl"></i>
                        <span class="text-sm">Seleccione un archivo <strong>.json</strong> con los datos estructurados. Tamaño máximo: <strong>10MB</strong>.</span>
                    </div>

                    <div class="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg">
                        <i class="pi pi-cloud-upload text-4xl text-surface-400"></i>
                        <p class="m-0 text-surface-500">Arrastre su archivo aquí o use el botón</p>
                        <p-fileupload 
                            mode="basic" 
                            chooseLabel="Elegir Archivo JSON" 
                            chooseIcon="pi pi-file"
                            accept=".json" 
                            maxFileSize="10000000" 
                            [auto]="true"
                            [customUpload]="true" 
                            (uploadHandler)="onUploadBulk($event)" />
                    </div>
                </div>
            </ng-template>
        </p-dialog>

        <div class="card">
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Productos Textil</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Gestión de productos textil en el sistema.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                        <p-button severity="success" label="Nuevo" icon="pi pi-plus" class="mr-2" (onClick)="abrirNuevo()" />
                        <p-button severity="secondary" label="Carga Masiva" icon="pi pi-upload" class="mr-2" (onClick)="abrirCargaMasiva()" />
                        <p-button severity="secondary" label="Recargar" icon="pi pi-refresh" [outlined]="true" (onClick)="cargarProductos()" [loading]="loading()" />
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
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} textils"
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
                        <th pSortableColumn="nbTejido" style="min-width: 12rem">Tejido <p-sortIcon field="nbTejido" /></th>
                        <th pSortableColumn="clEstatusProducto" style="min-width: 8rem">Estatus <p-sortIcon field="clEstatusProducto" /></th>
                        <th style="min-width: 10rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-prod>
                    <tr>
                        <td class="font-medium">{{ prod.clProducto }}</td>
                        <td class="font-medium">{{ prod.nbProducto }}</td>
                        <td class="font-mono">{{ prod.clHsCode || 'N/A' }}</td>
                        <td>{{ prod.nbTejido || 'N/A' }}</td>
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
                        <td colspan="6">No hay textils para mostrar.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO CREAR / EDITAR ═══ -->
        <p-dialog
            [(visible)]="dialogVisible"
            [style]="{ width: '900px' }"
            [header]="editando() ? 'Editar Textil' : 'Nuevo Textil'"
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
                                        <label class="block font-bold mb-3">Categoría</label>
                                        <p-select appendTo="body" [(ngModel)]="datosFormulario.idElemCategoria" [options]="categorias()" optionLabel="label" optionValue="value" placeholder="Seleccionar" fluid />
                                    </div>
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">Línea / Colección</label>
                                        <p-select appendTo="body" [(ngModel)]="datosFormulario.idElemLineaColeccion" [options]="colecciones()" optionLabel="label" optionValue="value" placeholder="Seleccionar" fluid />
                                    </div>
                                </div>

                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">Estatus</label>
                                        <p-select appendTo="body" [(ngModel)]="datosFormulario.clEstatusProducto" [options]="estatusOptions" optionLabel="label" optionValue="value" fluid />
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
                                        <label class="block font-bold mb-3">Tejido</label>
                                        <input type="text" pInputText [(ngModel)]="datosFormulario.nbTejido" fluid />
                                    </div>
                                    <div class="col-span-6 md:col-span-4">
                                        <label class="block font-bold mb-3">Corte</label>
                                        <input type="text" pInputText [(ngModel)]="datosFormulario.dsCorte" fluid />
                                    </div>
                                </div>

                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">Composición</label>
                                        <textarea pTextarea [(ngModel)]="datosFormulario.dsComposicion" rows="2" fluid></textarea>
                                    </div>
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">Gramaje (GSM)</label>
                                        <input type="number" pInputText [(ngModel)]="datosFormulario.noGramajeGsm" fluid />
                                    </div>
                                </div>

                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-6">
                                        <label class="block font-bold mb-3">Género</label>
                                        <p-select appendTo="body" [(ngModel)]="datosFormulario.idElemGenero" [options]="generos()" optionLabel="label" optionValue="value" placeholder="Seleccionar" fluid />
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
                                                        <p-select appendTo="body" [(ngModel)]="variante.clEstatusVariante" [options]="estatusOptions" optionLabel="label" optionValue="value" fluid />
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
                                                                <td><p-select appendTo="body" [(ngModel)]="sku.clEstatusSku" [options]="estatusOptions" optionLabel="label" optionValue="value" styleClass="w-32" /></td>
                                                                <td><input type="number" pInputText [(ngModel)]="sku.noStockDisponible" [min]="0" class="w-20" /></td>
                                                                <td><input type="number" pInputText [(ngModel)]="sku.noStockReservado" [min]="0" class="w-20" /></td>
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
export class ProductosTextil implements OnInit {
    private readonly apiService = inject(ProductosTextilApiService);
    private readonly catalogosService = inject(CatalogosApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);

    // ─── State ───
    productos = signal<ProductoTextil[]>([]);
    loading = signal<boolean>(false);
    saving = signal<boolean>(false);

    // ─── Dropdown Options ───
    categorias = signal<{label: string, value: number}[]>([]);
    colecciones = signal<{label: string, value: number}[]>([]);
    combinaciones = signal<{label: string, value: number}[]>([]);
    tallas = signal<{label: string, value: number}[]>([]);
    generos = signal<{label: string, value: number}[]>([]);

    estatusOptions = [
        { label: 'ACTIVO', value: 'ACTIVO' },
        { label: 'INACTIVO', value: 'INACTIVO' }
    ];

    // ─── Form Dialog ───
    dialogVisible: boolean = false;
    bulkDialogVisible: boolean = false;
    editando = signal<boolean>(false);
    submitted = signal<boolean>(false);
    idEditando = '';
    
    datosFormulario: CrearProductoTextilRequest = {
        clProducto: '',
        nbProducto: '',
        idElemCategoria: 0,
        idElemLineaColeccion: 0,
        clHsCode: '',
        clEstatusProducto: 'ACTIVO',
        nbTejido: '',
        dsComposicion: '',
        
        dsCorte: '',
        noGramajeGsm: 0,
        idElemGenero: 0,
        
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
                next: (data: any[]) => {
                    let mapData = (data || []).map((m) => ({
                        label: m.nbCatalogoElemento || m.clCatalogoElemento,
                        value: m.idCatalogoElemento,
                        parent: m.nbCatalogoElementoPadre || m.clCatalogoElementoPadre || ''
                    }));
                    
                    if (clCatalogo === 'TALLAS') {
                        // Filtrar para que solo muestre las tallas que sean hijas de Textil Infantil o Textil Adulto
                        mapData = mapData.filter(item => 
                            item.parent && item.parent.toString().toLowerCase().includes('textil')
                        );
                    }
                    
                    targetSignal.set(mapData);
                },
                error: () => console.error('Error cargando ' + clCatalogo)
            });
        };

        fetchCatalogo('DIVISIONES', this.categorias);
        fetchCatalogo('LINEAS_COLECCION', this.colecciones);
        fetchCatalogo('COMBINACIONES', this.combinaciones);
        fetchCatalogo('TALLAS', this.tallas);
        fetchCatalogo('GENEROS', this.generos);
    }

    cargarProductos(): void {
        this.loading.set(true);

        this.apiService.getProductosTextil().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => {
                this.productos.set(data);
                this.loading.set(false);
            },
            error: (error: HttpErrorResponse) => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los textils.', life: 5000 });
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

    abrirCargaMasiva(): void {
        this.bulkDialogVisible = true;
    }

    onUploadBulk(event: any): void {
        const file = event.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e: any) => {
            try {
                const jsonContent = JSON.parse(e.target.result);
                
                if (!Array.isArray(jsonContent)) {
                    this.messageService.add({ severity: 'error', summary: 'Error de Formato', detail: 'El archivo JSON debe contener un arreglo de productos.', life: 5000 });
                    event.options.clear(); // Limpiar el fileupload

                    return;
                }

                this.saving.set(true);
                this.apiService.crearProductosTextilBulk(jsonContent).pipe(
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe({
                    next: (res) => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Carga masiva completada correctamente.', life: 3000 });
                        this.bulkDialogVisible = false;
                        this.saving.set(false);
                        event.options.clear();
                        this.cargarProductos();
                    },
                    error: (err) => {
                        console.error(err);
                        this.messageService.add({ severity: 'error', summary: 'Error de Carga', detail: 'Hubo un error al procesar el archivo en el servidor.', life: 5000 });
                        this.saving.set(false);
                        event.options.clear();
                    }
                });
            } catch (error) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El archivo JSON tiene una sintaxis inválida.', life: 5000 });
                event.options.clear();
            }
        };

        reader.readAsText(file);
    }

    editarProducto(prod: ProductoTextil): void {
        const id = prod.id || (prod as any).idProducto;

        if (!id) return;

        this.loading.set(true);
        this.apiService.getProductoTextil(id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (fullProd: any) => {
                this.loading.set(false);
                console.log('API RESPONSE FULL PRODUCT:', fullProd);
                this.editando.set(true);
                this.idEditando = id;

                // Handle alternative array names
                const apiVariantes = fullProd.variantes || fullProd.productoVariantes || fullProd.variantesDtos || [];

                this.datosFormulario = {
                    clProducto: fullProd.clProducto || fullProd.ClProducto || '',
                    nbProducto: fullProd.nbProducto || fullProd.NbProducto || '',
                    idElemCategoria: Number(fullProd.idElemCategoria || fullProd.IdElemCategoria || 0),
                    idElemLineaColeccion: Number(fullProd.idElemLineaColeccion || fullProd.IdElemLineaColeccion || 0),
                    clHsCode: fullProd.clHsCode || fullProd.ClHsCode || '',
                    clEstatusProducto: fullProd.clEstatusProducto || fullProd.ClEstatusProducto || 'ACTIVO',
                    nbTejido: fullProd.nbTejido || fullProd.NbTejido || '',
                    dsComposicion: fullProd.dsComposicion || fullProd.DsComposicion || '',
                    
                    dsCorte: fullProd.dsCorte || fullProd.DsCorte || '',
                    noGramajeGsm: fullProd.noGramajeGsm || fullProd.NoGramajeGsm || 0,
                    idElemGenero: fullProd.idElemGenero || fullProd.IdElemGenero || 0,
                    
                    variantes: apiVariantes.map((v: any) => {
                        const apiSkus = v.skus || v.productoSkus || v.varianteSkus || v.lstSkus || [];

                        return {
                            idVariante: v.idVariante || v.id || v.idProductoVariante,
                            idElemCombinacion: Number(v.idElemCombinacion || v.idCombinacion || v.idCatalogoElementoCombinacion || 0),
                            urlImagen: v.urlImagen || v.UrlImagen || '',
                            clEstatusVariante: v.clEstatusVariante || v.ClEstatusVariante || 'ACTIVO',
                            skus: apiSkus.map((s: any) => ({
                                idSku: s.idSku || s.id || s.idProductoSku,
                                idElemTalla: Number(s.idElemTalla || s.idTalla || s.idCatalogoElementoTalla || 0),
                                clItem: s.clItem || s.ClItem || '',
                                clCodigoBarras: s.clCodigoBarras || s.ClCodigoBarras || s.codigoBarras || '',
                                clEstatusSku: s.clEstatusSku || s.ClEstatusSku || 'ACTIVO',
                                noStockDisponible: s.noStockDisponible !== undefined ? s.noStockDisponible : (s.NoStockDisponible !== undefined ? s.NoStockDisponible : (s.stockDisponible || s.StockDisponible || 0)),
                                noStockReservado: s.noStockReservado !== undefined ? s.noStockReservado : (s.NoStockReservado !== undefined ? s.NoStockReservado : (s.stockReservado || s.StockReservado || 0))
                            }))
                        };
                    })
                };
                this.submitted.set(false);
                this.dialogVisible = true;
            },
            error: (err) => {
                this.loading.set(false);
                console.error('Error loading product detail:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información detallada del textil.', life: 5000 });
            }
        });
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
            ? this.apiService.actualizarProductoTextil(this.idEditando, this.datosFormulario)
            : this.apiService.crearProductoTextil(this.datosFormulario);

        request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.saving.set(false);
                this.dialogVisible = false;
                this.cargarProductos();
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Registro guardado correctamente.' });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error al guardar', detail: 'Ocurrió un error al intentar guardar el textil.' });
            }
        });
    }

    confirmarEliminar(prod: ProductoTextil): void {
        this.confirmationService.confirm({
            message: '¿Eliminar el textil ' + prod.nbProducto + '?',
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const id = prod.id || (prod as any).idProducto;

                this.apiService.eliminarProductoTextil(id).pipe(
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe({
                    next: () => {
                        this.cargarProductos();
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Textil eliminado correctamente.' });
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
            idElemCategoria: 0,
            idElemLineaColeccion: 0,
            clHsCode: '',
            clEstatusProducto: 'ACTIVO',
            nbTejido: '',
            dsComposicion: '',
            
            dsCorte: '',
            noGramajeGsm: 0,
            idElemGenero: 0,
            
            variantes: []
        };
    }
}
