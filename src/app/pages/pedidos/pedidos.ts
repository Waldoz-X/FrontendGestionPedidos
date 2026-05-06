import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TimelineModule } from 'primeng/timeline';
import { TooltipModule } from 'primeng/tooltip';
import { EstatusPedido, Pedido, HistorialPedido, CrearPedidoRequest, CrearLineaPedidoRequest } from '../service/pedidos-api.types';
import { PedidosService } from '../service/pedidos.service';
import { ClientesService } from '../service/clientes.service';
import { CatalogoService } from '../service/catalogo.service';
import { Cliente } from '../service/clientes-api.types';

@Component({
    selector: 'p-pedidos',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
        TagModule,
        DialogModule,
        TextareaModule,
        TimelineModule,
        TooltipModule,
        CurrencyPipe,
        DatePipe
    ],
    template: `
        <div class="card">
            <!-- ─── HEADER ─── -->
            <div class="flex items-center justify-between mb-4 gap-4">
                <div>
                    <div class="font-semibold text-xl">Pedidos</div>
                    <p class="m-0 text-surface-500 dark:text-surface-400">Gestión de pedidos de venta.</p>
                </div>
                <div class="flex gap-2">
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" (onClick)="cargarPedidos()" [loading]="loading()"></p-button>
                    <p-button label="Nuevo Pedido" icon="pi pi-plus" (onClick)="mostrarDialogoCrear()"></p-button>
                </div>
            </div>

            <!-- ─── FILTROS ─── -->
            <div class="grid grid-cols-12 gap-4 mb-4">
                <div class="col-span-12 md:col-span-3">
                    <label class="block mb-2">Cliente</label>
                    <p-select
                        [(ngModel)]="filtroCliente"
                        [ngModelOptions]="{ standalone: true }"
                        [options]="clienteOptions()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Todos"
                        [filter]="true"
                        [showClear]="true"
                        class="w-full"
                        (onChange)="cargarPedidos()"
                    ></p-select>
                </div>
                <div class="col-span-12 md:col-span-3">
                    <label class="block mb-2">Estatus</label>
                    <p-select
                        [(ngModel)]="filtroEstatus"
                        [ngModelOptions]="{ standalone: true }"
                        [options]="estatusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Todos"
                        [showClear]="true"
                        class="w-full"
                        (onChange)="cargarPedidos()"
                    ></p-select>
                </div>
            </div>

            <!-- ─── MENSAJES ─── -->
            @if (errorMessage()) {
                <div class="mb-4 p-3 border-round bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                    {{ errorMessage() }}
                </div>
            }

            <!-- ─── TABLA ─── -->
            <p-table
                [value]="pedidos()"
                dataKey="id"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} pedidos"
                [showCurrentPageReport]="true"
                [tableStyle]="{ 'min-width': '80rem' }"
            >
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="folio">Folio <p-sortIcon field="folio" /></th>
                        <th>Cliente</th>
                        <th pSortableColumn="fecha">Fecha <p-sortIcon field="fecha" /></th>
                        <th pSortableColumn="estatus">Estatus <p-sortIcon field="estatus" /></th>
                        <th>Moneda</th>
                        <th pSortableColumn="subtotal" class="text-right">Subtotal <p-sortIcon field="subtotal" /></th>
                        <th class="text-right">Dto. Com.</th>
                        <th class="text-right">Dto. Adm.</th>
                        <th pSortableColumn="total" class="text-right">Total <p-sortIcon field="total" /></th>
                        <th>Líneas</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template #body let-pedido>
                    <tr>
                        <td class="font-mono font-medium">{{ pedido.folio }}</td>
                        <td>{{ pedido.nombreCliente }}</td>
                        <td>{{ pedido.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td>
                            <p-tag [value]="pedido.estatus" [severity]="getSeverity(pedido.estatus)" />
                        </td>
                        <td>{{ pedido.moneda }}</td>
                        <td class="text-right">{{ pedido.subtotal | currency:pedido.moneda:'symbol':'1.2-2' }}</td>
                        <td class="text-right">{{ pedido.descuentoComercial | currency:pedido.moneda:'symbol':'1.2-2' }}</td>
                        <td class="text-right">{{ pedido.descuentoAdmin | currency:pedido.moneda:'symbol':'1.2-2' }}</td>
                        <td class="text-right font-semibold">{{ pedido.total | currency:pedido.moneda:'symbol':'1.2-2' }}</td>
                        <td class="text-center">{{ pedido.lineas.length }}</td>
                        <td>
                            <div class="flex gap-1">
                                <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" pTooltip="Ver detalle" (onClick)="verDetalle(pedido)"></p-button>
                                <p-button icon="pi pi-history" [rounded]="true" [text]="true" severity="secondary" pTooltip="Historial" (onClick)="verHistorial(pedido)"></p-button>
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="11">No hay pedidos para mostrar.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO CREAR PEDIDO ═══ -->
        <p-dialog
            header="Nuevo Pedido"
            [(visible)]="crearDialogVisible"
            [modal]="true"
            [style]="{ width: '60rem' }"
            [closable]="true"
        >
            <form [formGroup]="crearForm" class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-6">
                    <label class="block mb-2 font-medium">Cliente *</label>
                    <p-select
                        formControlName="idCliente"
                        [options]="clienteOptions()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccionar..."
                        [filter]="true"
                        class="w-full"
                        (onChange)="onCrearClienteChange($event.value)"
                    ></p-select>
                </div>
                <div class="col-span-12 md:col-span-6">
                    <label class="block mb-2 font-medium">Dirección de Envío *</label>
                    <p-select
                        formControlName="idDireccionEnvio"
                        [options]="direccionOptions()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccionar..."
                        class="w-full"
                    ></p-select>
                </div>
                <div class="col-span-12 md:col-span-4">
                    <label class="block mb-2 font-medium">Política de Precios *</label>
                    <p-select
                        formControlName="idPolitica"
                        [options]="politicaOptions()"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccionar..."
                        class="w-full"
                    ></p-select>
                </div>
                <div class="col-span-12 md:col-span-4">
                    <label class="block mb-2 font-medium">Moneda *</label>
                    <p-select
                        formControlName="moneda"
                        [options]="monedaOptions"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                    ></p-select>
                </div>
                <div class="col-span-12 md:col-span-4">
                    <label class="block mb-2 font-medium">Notas</label>
                    <textarea pTextarea formControlName="notas" class="w-full" rows="2"></textarea>
                </div>

                <!-- ─── Líneas del pedido ─── -->
                <div class="col-span-12">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-medium">Líneas del pedido</span>
                        <p-button label="Agregar línea" icon="pi pi-plus" severity="secondary" [outlined]="true" size="small" (onClick)="agregarLineaCrear()"></p-button>
                    </div>
                    @if (lineasCrear().length === 0) {
                        <div class="p-3 bg-surface-50 dark:bg-surface-800 border-round text-surface-500 text-center">
                            Aún no has agregado líneas al pedido.
                        </div>
                    } @else {
                        <p-table [value]="lineasCrear()" dataKey="idx" [tableStyle]="{ 'min-width': '40rem' }">
                            <ng-template #header>
                                <tr>
                                    <th>SKU</th>
                                    <th class="text-right">Cantidad</th>
                                    <th class="text-right">Precio Unit.</th>
                                    <th class="text-right">Descuento</th>
                                    <th></th>
                                </tr>
                            </ng-template>
                            <ng-template #body let-linea let-i="rowIndex">
                                <tr>
                                    <td>
                                        <p-select
                                            [(ngModel)]="linea.idSku"
                                            [ngModelOptions]="{ standalone: true }"
                                            [options]="skuOptions()"
                                            optionLabel="label"
                                            optionValue="value"
                                            [filter]="true"
                                            placeholder="Seleccionar SKU..."
                                            class="w-full"
                                        ></p-select>
                                    </td>
                                    <td>
                                        <p-inputNumber [(ngModel)]="linea.cantidad" [ngModelOptions]="{ standalone: true }" [min]="1" [showButtons]="true" class="w-full" inputStyleClass="text-right w-full"></p-inputNumber>
                                    </td>
                                    <td>
                                        <p-inputNumber [(ngModel)]="linea.precioUnitario" [ngModelOptions]="{ standalone: true }" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2" class="w-full" inputStyleClass="text-right w-full"></p-inputNumber>
                                    </td>
                                    <td>
                                        <p-inputNumber [(ngModel)]="linea.descuentoLinea" [ngModelOptions]="{ standalone: true }" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" class="w-full" inputStyleClass="text-right w-full"></p-inputNumber>
                                    </td>
                                    <td class="text-center">
                                        <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="quitarLineaCrear(i)"></p-button>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    }
                </div>
            </form>

            @if (crearErrorMessage()) {
                <div class="mt-4 p-3 border-round bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                    {{ crearErrorMessage() }}
                </div>
            }

            <ng-template #footer>
                <p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="crearDialogVisible = false"></p-button>
                <p-button label="Crear Pedido" icon="pi pi-check" [loading]="saving()" (onClick)="crearPedido()"></p-button>
            </ng-template>
        </p-dialog>

        <!-- ═══ DIALOGO DETALLE ═══ -->
        <p-dialog
            header="Detalle del pedido"
            [(visible)]="detalleDialogVisible"
            [modal]="true"
            [style]="{ width: '60rem' }"
            [closable]="true"
        >
            @if (pedidoDetalle()) {
                <div class="grid grid-cols-12 gap-4 mb-4">
                    <div class="col-span-6 md:col-span-3">
                        <span class="block text-surface-500 dark:text-surface-400 mb-1">Folio</span>
                        <span class="font-mono font-semibold text-lg">{{ pedidoDetalle()!.folio }}</span>
                    </div>
                    <div class="col-span-6 md:col-span-3">
                        <span class="block text-surface-500 dark:text-surface-400 mb-1">Estatus</span>
                        <p-tag [value]="pedidoDetalle()!.estatus" [severity]="getSeverity(pedidoDetalle()!.estatus)" />
                    </div>
                    <div class="col-span-6 md:col-span-3">
                        <span class="block text-surface-500 dark:text-surface-400 mb-1">Fecha</span>
                        <span>{{ pedidoDetalle()!.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                    <div class="col-span-6 md:col-span-3">
                        <span class="block text-surface-500 dark:text-surface-400 mb-1">Moneda</span>
                        <span>{{ pedidoDetalle()!.moneda }}</span>
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <span class="block text-surface-500 dark:text-surface-400 mb-1">Cliente</span>
                        <span>{{ pedidoDetalle()!.nombreCliente }}</span>
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <span class="block text-surface-500 dark:text-surface-400 mb-1">Notas</span>
                        <span>{{ pedidoDetalle()!.notas || '—' }}</span>
                    </div>
                </div>

                <div class="font-medium mb-2">Líneas</div>
                <p-table [value]="pedidoDetalle()!.lineas" dataKey="id" [tableStyle]="{ 'min-width': '40rem' }">
                    <ng-template #header>
                        <tr>
                            <th>SKU ID</th>
                            <th class="text-right">Cantidad</th>
                            <th class="text-right">Precio Unit.</th>
                            <th class="text-right">Descuento</th>
                            <th class="text-right">Subtotal</th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-linea>
                        <tr>
                            <td class="font-mono">{{ linea.idSku | slice:0:8 }}...</td>
                            <td class="text-right">{{ linea.cantidad }}</td>
                            <td class="text-right">{{ linea.precioUnitario | currency:pedidoDetalle()!.moneda:'symbol':'1.2-2' }}</td>
                            <td class="text-right">{{ linea.descuentoLinea | currency:pedidoDetalle()!.moneda:'symbol':'1.2-2' }}</td>
                            <td class="text-right font-semibold">{{ linea.subtotal | currency:pedidoDetalle()!.moneda:'symbol':'1.2-2' }}</td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="5">Sin líneas.</td>
                        </tr>
                    </ng-template>
                </p-table>

                <div class="grid grid-cols-12 gap-2 mt-4">
                    <div class="col-span-12 md:col-start-9 md:col-span-4 flex flex-col gap-2 text-right">
                        <div class="flex justify-between"><span class="text-surface-500">Subtotal:</span> <span>{{ pedidoDetalle()!.subtotal | currency:pedidoDetalle()!.moneda:'symbol':'1.2-2' }}</span></div>
                        <div class="flex justify-between"><span class="text-surface-500">Dto. Comercial:</span> <span>-{{ pedidoDetalle()!.descuentoComercial | currency:pedidoDetalle()!.moneda:'symbol':'1.2-2' }}</span></div>
                        <div class="flex justify-between"><span class="text-surface-500">Dto. Admin:</span> <span>-{{ pedidoDetalle()!.descuentoAdmin | currency:pedidoDetalle()!.moneda:'symbol':'1.2-2' }}</span></div>
                        <hr class="border-surface-200 dark:border-surface-700" />
                        <div class="flex justify-between font-semibold text-lg"><span>Total:</span> <span>{{ pedidoDetalle()!.total | currency:pedidoDetalle()!.moneda:'symbol':'1.2-2' }}</span></div>
                    </div>
                </div>
            }
        </p-dialog>

        <!-- ═══ DIALOGO HISTORIAL ═══ -->
        <p-dialog
            header="Historial del pedido"
            [(visible)]="historialDialogVisible"
            [modal]="true"
            [style]="{ width: '45rem' }"
            [closable]="true"
        >
            @if (loadingHistorial()) {
                <div class="text-center p-4">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>
            } @else if (historial().length === 0) {
                <div class="text-center text-surface-500 p-4">Sin historial de cambios de estatus.</div>
            } @else {
                <p-timeline [value]="historial()" align="left">
                    <ng-template #content let-event>
                        <div class="mb-2">
                            <div class="flex items-center gap-2 mb-1">
                                <p-tag [value]="event.estatusAnterior" [severity]="getSeverity(event.estatusAnterior)" />
                                <i class="pi pi-arrow-right text-surface-400"></i>
                                <p-tag [value]="event.estatusNuevo" [severity]="getSeverity(event.estatusNuevo)" />
                            </div>
                            @if (event.notas) {
                                <div class="text-sm text-surface-600 dark:text-surface-300">{{ event.notas }}</div>
                            }
                            <div class="text-xs text-surface-400 mt-1">{{ event.registradoEn | date:'dd/MM/yyyy HH:mm:ss' }}</div>
                        </div>
                    </ng-template>
                </p-timeline>
            }
        </p-dialog>
    `
})
export class Pedidos implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly pedidosService = inject(PedidosService);
    private readonly clientesService = inject(ClientesService);
    private readonly catalogoService = inject(CatalogoService);
    private readonly destroyRef = inject(DestroyRef);

    // ─── State ───
    pedidos = signal<Pedido[]>([]);
    clientes = signal<Cliente[]>([]);
    loading = signal<boolean>(false);
    saving = signal<boolean>(false);
    errorMessage = signal<string>('');

    // Filtros
    filtroCliente = '';
    filtroEstatus = '';

    estatusOptions = [
        { label: 'Borrador', value: 'Borrador' },
        { label: 'Enviado', value: 'Enviado' },
        { label: 'Aprobado', value: 'Aprobado' },
        { label: 'Rechazado', value: 'Rechazado' },
        { label: 'Cancelado', value: 'Cancelado' }
    ];

    monedaOptions = [
        { label: 'USD', value: 'USD' },
        { label: 'MXN', value: 'MXN' }
    ];

    clienteOptions = computed(() =>
        this.clientes().map((c) => ({ value: c.id, label: `${c.nombreComercial}` }))
    );

    // ─── Crear dialogo ───
    crearDialogVisible = false;
    crearErrorMessage = signal<string>('');
    lineasCrear = signal<{ idx: number; idSku: string; cantidad: number; precioUnitario: number; descuentoLinea: number }[]>([]);
    private lineaIdx = 0;

    direcciones = signal<{ id: string; direccion: string }[]>([]);
    direccionOptions = computed(() =>
        this.direcciones().map((d) => ({ value: d.id, label: d.direccion }))
    );

    politicas = signal<{ id: string; nombre: string }[]>([]);
    politicaOptions = computed(() =>
        this.politicas().map((p) => ({ value: p.id, label: p.nombre }))
    );

    skus = signal<{ id: string; codigo: string }[]>([]);
    skuOptions = computed(() =>
        this.skus().map((s) => ({ value: s.id, label: s.codigo }))
    );

    crearForm = this.fb.nonNullable.group({
        idCliente: ['', Validators.required],
        idDireccionEnvio: ['', Validators.required],
        idPolitica: ['', Validators.required],
        moneda: ['USD' as const, Validators.required],
        notas: ['']
    });

    // ─── Detalle dialogo ───
    detalleDialogVisible = false;
    pedidoDetalle = signal<Pedido | null>(null);

    // ─── Historial dialogo ───
    historialDialogVisible = false;
    historial = signal<HistorialPedido[]>([]);
    loadingHistorial = signal<boolean>(false);

    ngOnInit(): void {
        this.crearForm.controls.idDireccionEnvio.disable();

        this.clientesService.getClientes({ activo: true }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({ next: (r) => this.clientes.set(r) });

        this.catalogoService.getPoliticas().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => this.politicas.set(r.map((p: any) => ({ id: p.id, nombre: p.nombre })))
        });

        this.catalogoService.getSkus({}).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => this.skus.set(r.map((s: any) => ({ id: s.id, codigo: s.codigo || s.id.slice(0, 8) })))
        });

        this.cargarPedidos();
    }

    // ─── Listado ───

    cargarPedidos(): void {
        this.loading.set(true);
        this.errorMessage.set('');

        this.pedidosService.getPedidos({
            estatus: this.filtroEstatus || undefined,
            idCliente: this.filtroCliente || undefined
        }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => {
                this.pedidos.set(r);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.errorMessage.set('No se pudieron cargar los pedidos.');
            }
        });
    }

    getSeverity(estatus: EstatusPedido | string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        switch (estatus) {
            case 'Borrador':
                return 'secondary';
            case 'Enviado':
                return 'info';
            case 'Aprobado':
                return 'success';
            case 'Rechazado':
                return 'danger';
            case 'Cancelado':
                return 'warn';
            default:
                return undefined;
        }
    }

    // ─── Crear Pedido ───

    mostrarDialogoCrear(): void {
        this.crearDialogVisible = true;
        this.crearErrorMessage.set('');
        this.lineasCrear.set([]);
        this.lineaIdx = 0;
        this.direcciones.set([]);
        this.crearForm.reset({ idCliente: '', idDireccionEnvio: '', idPolitica: '', moneda: 'USD', notas: '' });
        this.crearForm.controls.idDireccionEnvio.disable();
    }

    onCrearClienteChange(idCliente: string): void {
        this.crearForm.patchValue({ idDireccionEnvio: '' });

        if (!idCliente) {
            this.direcciones.set([]);
            this.crearForm.controls.idDireccionEnvio.disable();

            return;
        }

        this.crearForm.controls.idDireccionEnvio.enable();
        this.clientesService.getDirecciones(idCliente).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => this.direcciones.set(r.map((d) => ({
                id: d.id,
                direccion: `${d.alias} — ${d.linea1}${d.linea2 ? ', ' + d.linea2 : ''}, ${d.ciudad}, ${d.estado}`
            }))),
            error: () => this.direcciones.set([])
        });
    }

    agregarLineaCrear(): void {
        this.lineasCrear.update((prev) => [
            ...prev,
            { idx: this.lineaIdx++, idSku: '', cantidad: 1, precioUnitario: 0, descuentoLinea: 0 }
        ]);
    }

    quitarLineaCrear(index: number): void {
        this.lineasCrear.update((prev) => prev.filter((_, i) => i !== index));
    }

    crearPedido(): void {
        this.crearErrorMessage.set('');

        if (this.crearForm.invalid) {
            this.crearForm.markAllAsTouched();
            this.crearErrorMessage.set('Completa todos los campos obligatorios.');

            return;
        }

        const lineas = this.lineasCrear();

        if (lineas.length === 0) {
            this.crearErrorMessage.set('Agrega al menos una línea al pedido.');

            return;
        }

        const invalidLine = lineas.find((l) => !l.idSku || l.cantidad < 1);

        if (invalidLine) {
            this.crearErrorMessage.set('Todas las líneas deben tener un SKU y cantidad >= 1.');

            return;
        }

        this.saving.set(true);
        const formValue = this.crearForm.getRawValue();
        const payload: CrearPedidoRequest = {
            idCliente: formValue.idCliente,
            idDireccionEnvio: formValue.idDireccionEnvio,
            idPolitica: formValue.idPolitica,
            moneda: formValue.moneda,
            notas: formValue.notas,
            lineas: lineas.map((l): CrearLineaPedidoRequest => ({
                idSku: l.idSku,
                cantidad: l.cantidad,
                precioUnitario: l.precioUnitario,
                descuentoLinea: l.descuentoLinea
            }))
        };

        this.pedidosService.crearPedido(payload).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.saving.set(false);
                this.crearDialogVisible = false;
                this.cargarPedidos();
            },
            error: (err) => {
                this.saving.set(false);

                const detail = err?.error?.detail || err?.error?.title || 'No se pudo crear el pedido.';

                this.crearErrorMessage.set(detail);
            }
        });
    }

    // ─── Detalle ───

    verDetalle(pedido: Pedido): void {
        this.pedidoDetalle.set(pedido);
        this.detalleDialogVisible = true;
    }

    // ─── Historial ───

    verHistorial(pedido: Pedido): void {
        this.historialDialogVisible = true;
        this.historial.set([]);
        this.loadingHistorial.set(true);

        this.pedidosService.getHistorial(pedido.id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => {
                this.historial.set(r);
                this.loadingHistorial.set(false);
            },
            error: () => {
                this.loadingHistorial.set(false);
            }
        });
    }
}
