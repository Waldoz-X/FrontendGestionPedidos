import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import {
    ActualizarClienteRequest,
    AsignacionClienteEmpleado,
    Cliente,
    CrearAsignacionClienteEmpleadoRequest,
    CrearClienteRequest,
    CrearDireccionClienteRequest,
    DireccionCliente
} from '../service/clientes/clientes-api.types';
import { ClientesApiService } from '../service/clientes/clientes-api.service';
import { ClientesDireccionesApiService } from '../service/clientes/clientes-direcciones-api.service';
import { AsignacionesApiService } from '../service/clientes/asignaciones-api.service';
import { Empleado } from '../service/empleados/empleados-api.types';
import { EmpleadosApiService } from '../service/empleados/empleados-api.service';
import { CatalogosMaestrosService } from '../service/catalogos-maestros.service';
import { Pais, Estado } from '../service/catalogos-maestros-api.types';
import { CatalogosApiService } from '../service/catalogos-api.service';

@Component({
    selector: 'p-clientes',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
        CheckboxModule,
        TagModule,
        ToastModule,
        ToolbarModule,
        DialogModule,
        ConfirmDialogModule,
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
                        <div class="font-semibold text-xl">Clientes</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Gestión de clientes, direcciones y asignaciones.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nuevo" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirCrearCliente()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarClientes()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <!-- ═══ TABLA CLIENTES ═══ -->
            <p-table
                #dt
                [value]="clientes()"
                dataKey="id"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} clientes"
                [showCurrentPageReport]="true"
                [globalFilterFields]="['nombreComercial', 'tipo', 'moneda', 'canalVenta']"
                [tableStyle]="{ 'min-width': '75rem' }"
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
                        <th pSortableColumn="nombreComercial" style="min-width: 14rem">Nombre comercial <p-sortIcon field="nombreComercial" /></th>
                        <th pSortableColumn="tipo" style="min-width: 8rem">Tipo <p-sortIcon field="tipo" /></th>
                        <th style="min-width: 6rem">Moneda</th>
                        <th style="min-width: 8rem">Canal venta</th>
                        <th pSortableColumn="limiteCredito" class="text-right" style="min-width: 10rem">Límite crédito <p-sortIcon field="limiteCredito" /></th>
                        <th pSortableColumn="activo" style="min-width: 7rem">Estado <p-sortIcon field="activo" /></th>
                        <th style="min-width: 16rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-cliente>
                    <tr>
                        <td class="font-medium">{{ cliente.nombreComercial }}</td>
                        <td>{{ cliente.tipo }}</td>
                        <td>{{ cliente.moneda }}</td>
                        <td>{{ cliente.canalVenta }}</td>
                        <td class="text-right">{{ cliente.limiteCredito | number:'1.2-2' }}</td>
                        <td>
                            <p-tag [value]="cliente.activo ? 'Activo' : 'Inactivo'" [severity]="cliente.activo ? 'success' : 'danger'" />
                        </td>
                        <td>
                            <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (onClick)="abrirEditarCliente(cliente)" pTooltip="Editar" />
                            <p-button icon="pi pi-map-marker" class="mr-2" [rounded]="true" [outlined]="true" severity="info" (onClick)="abrirDirecciones(cliente)" pTooltip="Direcciones" />
                            <p-button icon="pi pi-link" class="mr-2" [rounded]="true" [outlined]="true" severity="secondary" (onClick)="abrirAsignaciones(cliente)" pTooltip="Asignaciones" />
                            @if (cliente.activo) {
                                <p-button icon="pi pi-ban" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmarDesactivar(cliente)" pTooltip="Desactivar" />
                            } @else {
                                <p-button icon="pi pi-check-circle" [rounded]="true" [outlined]="true" severity="success" (onClick)="confirmarActivar(cliente)" pTooltip="Reactivar" />
                            }
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="7">No hay clientes para mostrar.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO CREAR CLIENTE ═══ -->
        <p-dialog [(visible)]="crearDialogVisible" [style]="{ width: '550px' }" header="Nuevo Cliente" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="create_nombreComercial" class="block font-bold mb-3">Nombre comercial</label>
                        <input type="text" pInputText id="create_nombreComercial" [(ngModel)]="nuevoCliente.nombreComercial" required fluid />
                        @if (submitted() && !nuevoCliente.nombreComercial) {
                            <small class="text-red-500">Requerido.</small>
                        }
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="create_tipo" class="block font-bold mb-3">Tipo</label>
                            <p-select appendTo="body" inputId="create_tipo" [(ngModel)]="nuevoCliente.tipo" [options]="tipoOptions" optionLabel="label" optionValue="value" fluid />
                        </div>
                        <div class="col-span-6">
                            <label for="create_moneda" class="block font-bold mb-3">Moneda</label>
                            <p-select appendTo="body" inputId="create_moneda" [(ngModel)]="nuevoCliente.moneda" [options]="monedaOptions()" optionLabel="label" optionValue="value" fluid />
                        </div>
                    </div>
                    <div>
                        <label for="create_canalVenta" class="block font-bold mb-3">Canal de venta</label>
                        <input type="text" pInputText id="create_canalVenta" [(ngModel)]="nuevoCliente.canalVenta" required fluid />
                        @if (submitted() && !nuevoCliente.canalVenta) {
                            <small class="text-red-500">Requerido.</small>
                        }
                    </div>
                    <div>
                        <label for="create_limiteCredito" class="block font-bold mb-3">Límite de crédito</label>
                        <p-inputNumber inputId="create_limiteCredito" [(ngModel)]="nuevoCliente.limiteCredito" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" fluid />
                    </div>
                    <div class="flex items-center gap-2">
                        <p-checkbox inputId="create_activo" [(ngModel)]="nuevoCliente.activo" [binary]="true" />
                        <label for="create_activo">Activo</label>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="crearDialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarNuevoCliente()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <!-- ═══ DIALOGO EDITAR CLIENTE ═══ -->
        <p-dialog [(visible)]="editarDialogVisible" [style]="{ width: '550px' }" header="Editar Cliente" [modal]="true">
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label for="edit_nombreComercial" class="block font-bold mb-3">Nombre comercial</label>
                        <input type="text" pInputText id="edit_nombreComercial" [(ngModel)]="datosEditar.nombreComercial" required fluid />
                        @if (submittedEditar() && !datosEditar.nombreComercial) {
                            <small class="text-red-500">Requerido.</small>
                        }
                    </div>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="edit_tipo" class="block font-bold mb-3">Tipo</label>
                            <p-select appendTo="body" inputId="edit_tipo" [(ngModel)]="datosEditar.tipo" [options]="tipoOptions" optionLabel="label" optionValue="value" fluid />
                        </div>
                        <div class="col-span-6">
                            <label for="edit_moneda" class="block font-bold mb-3">Moneda</label>
                            <p-select appendTo="body" inputId="edit_moneda" [(ngModel)]="datosEditar.moneda" [options]="monedaOptions()" optionLabel="label" optionValue="value" fluid />
                        </div>
                    </div>
                    <div>
                        <label for="edit_canalVenta" class="block font-bold mb-3">Canal de venta</label>
                        <input type="text" pInputText id="edit_canalVenta" [(ngModel)]="datosEditar.canalVenta" required fluid />
                        @if (submittedEditar() && !datosEditar.canalVenta) {
                            <small class="text-red-500">Requerido.</small>
                        }
                    </div>
                    <div>
                        <label for="edit_limiteCredito" class="block font-bold mb-3">Límite de crédito</label>
                        <p-inputNumber inputId="edit_limiteCredito" [(ngModel)]="datosEditar.limiteCredito" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" fluid />
                    </div>
                    <div class="flex items-center gap-2">
                        <p-checkbox inputId="edit_activo" [(ngModel)]="datosEditar.activo" [binary]="true" />
                        <label for="edit_activo">Activo</label>
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="editarDialogVisible = false" />
                <p-button label="Guardar cambios" icon="pi pi-check" (onClick)="guardarEdicionCliente()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <!-- ═══ DIALOGO DIRECCIONES ═══ -->
        <p-dialog
            [(visible)]="direccionesDialogVisible"
            [style]="{ width: '70rem' }"
            [header]="'Direcciones — ' + clienteSeleccionadoNombre()"
            [modal]="true"
        >
            <ng-template #content>
                <!-- Formulario Dirección -->
                <div class="flex items-center justify-between mb-4">
                    <span class="font-medium text-lg">{{ direccionEditandoId() ? 'Editar dirección' : 'Nueva dirección' }}</span>
                    <div class="flex gap-2">
                        @if (direccionEditandoId()) {
                            <p-button label="Cancelar edición" icon="pi pi-times" severity="secondary" [outlined]="true" size="small" (onClick)="limpiarDireccionForm()" />
                        }
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4 mb-6">
                    <div class="col-span-12 md:col-span-3">
                        <label for="dir_alias" class="block font-bold mb-2">Alias</label>
                        <input type="text" pInputText id="dir_alias" [(ngModel)]="direccionFormData.alias" fluid />
                    </div>
                    <div class="col-span-12 md:col-span-5">
                        <label for="dir_linea1" class="block font-bold mb-2">Línea 1</label>
                        <input type="text" pInputText id="dir_linea1" [(ngModel)]="direccionFormData.linea1" fluid />
                    </div>
                    <div class="col-span-12 md:col-span-4">
                        <label for="dir_linea2" class="block font-bold mb-2">Línea 2</label>
                        <input type="text" pInputText id="dir_linea2" [(ngModel)]="direccionFormData.linea2" fluid />
                    </div>
                    <div class="col-span-12 md:col-span-3">
                        <label for="dir_ciudad" class="block font-bold mb-2">Ciudad</label>
                        <input type="text" pInputText id="dir_ciudad" [(ngModel)]="direccionFormData.ciudad" fluid />
                    </div>
                    <div class="col-span-12 md:col-span-3">
                        <label for="dir_estado" class="block font-bold mb-2">Estado</label>
                        <p-select appendTo="body"
                            inputId="dir_estado"
                            [(ngModel)]="direccionFormData.estado"
                            [options]="estadosFiltrados()"
                            optionLabel="nombre"
                            optionValue="nombre"
                            placeholder="Estado..."
                            [filter]="true"
                            fluid
                            [disabled]="!direccionFormData.pais"
                        />
                    </div>
                    <div class="col-span-12 md:col-span-2">
                        <label for="dir_cp" class="block font-bold mb-2">C.P.</label>
                        <input type="text" pInputText id="dir_cp" [(ngModel)]="direccionFormData.codigoPostal" fluid />
                    </div>
                    <div class="col-span-12 md:col-span-2">
                        <label for="dir_pais" class="block font-bold mb-2">País</label>
                        <p-select appendTo="body"
                            inputId="dir_pais"
                            [(ngModel)]="direccionFormData.pais"
                            [options]="paises()"
                            optionLabel="nombre"
                            optionValue="codigoISO"
                            placeholder="País..."
                            fluid
                            (onChange)="onPaisChange($event.value)"
                        />
                    </div>
                    <div class="col-span-12 md:col-span-2 flex items-end gap-2">
                        <p-checkbox inputId="dir_principal" [(ngModel)]="direccionFormData.esPrincipal" [binary]="true" />
                        <label for="dir_principal">Principal</label>
                    </div>
                    <div class="col-span-12 flex justify-end">
                        <p-button
                            [label]="direccionEditandoId() ? 'Actualizar' : 'Agregar'"
                            [icon]="direccionEditandoId() ? 'pi pi-check' : 'pi pi-plus'"
                            (onClick)="guardarDireccion()"
                            [loading]="savingDireccion()"
                        />
                    </div>
                </div>

                <!-- Tabla Direcciones -->
                <p-table [value]="direcciones()" dataKey="id" [loading]="loadingDirecciones()" [tableStyle]="{ 'min-width': '50rem' }">
                    <ng-template #header>
                        <tr>
                            <th>Alias</th>
                            <th>Línea 1</th>
                            <th>Ciudad</th>
                            <th>Estado</th>
                            <th>País</th>
                            <th>Principal</th>
                            <th></th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-dir>
                        <tr>
                            <td class="font-medium">{{ dir.alias }}</td>
                            <td>{{ dir.linea1 }}</td>
                            <td>{{ dir.ciudad }}</td>
                            <td>{{ dir.estado }}</td>
                            <td>{{ dir.pais }}</td>
                            <td>
                                <p-tag [value]="dir.esPrincipal ? 'Sí' : 'No'" [severity]="dir.esPrincipal ? 'success' : 'secondary'" />
                            </td>
                            <td>
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editarDireccion(dir)" pTooltip="Editar" />
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="7" class="text-center text-surface-500">No hay direcciones registradas.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </ng-template>
        </p-dialog>

        <!-- ═══ DIALOGO ASIGNACIONES ═══ -->
        <p-dialog
            [(visible)]="asignacionesDialogVisible"
            [style]="{ width: '65rem' }"
            [header]="'Asignaciones — ' + clienteSeleccionadoNombre()"
            [modal]="true"
        >
            <ng-template #content>
                <!-- Formulario Asignación -->
                <div class="flex items-center justify-between mb-4">
                    <span class="font-medium text-lg">{{ asignacionEditandoId() ? 'Editar asignación' : 'Nueva asignación' }}</span>
                    @if (asignacionEditandoId()) {
                        <p-button label="Cancelar edición" icon="pi pi-times" severity="secondary" [outlined]="true" size="small" (onClick)="limpiarAsignacionForm()" />
                    }
                </div>

                <div class="grid grid-cols-12 gap-4 mb-6">
                    <div class="col-span-12 md:col-span-5">
                        <label for="asig_empleado" class="block font-bold mb-2">Empleado</label>
                        <p-select appendTo="body"
                            inputId="asig_empleado"
                            [(ngModel)]="asignacionFormData.idEmpleado"
                            [options]="empleadoOptions()"
                            optionLabel="label"
                            optionValue="value"
                            [filter]="true"
                            filterBy="label"
                            placeholder="Seleccionar empleado..."
                            fluid
                            [disabled]="!!asignacionEditandoId() || loadingEmpleados()"
                        />
                        @if (loadingEmpleados()) {
                            <small class="text-surface-500 dark:text-surface-400">Cargando empleados...</small>
                        }
                    </div>
                    <div class="col-span-12 md:col-span-3">
                        <label for="asig_tipo" class="block font-bold mb-2">Tipo relación</label>
                        <input type="text" pInputText id="asig_tipo" [(ngModel)]="asignacionFormData.clTipoRelacion" fluid />
                    </div>
                    <div class="col-span-12 md:col-span-2 flex items-end gap-2">
                        <p-checkbox inputId="asig_activo" [(ngModel)]="asignacionFormData.activo" [binary]="true" />
                        <label for="asig_activo">Activo</label>
                    </div>
                    <div class="col-span-12 md:col-span-2 flex items-end">
                        <p-button
                            [label]="asignacionEditandoId() ? 'Actualizar' : 'Asignar'"
                            [icon]="asignacionEditandoId() ? 'pi pi-check' : 'pi pi-plus'"
                            (onClick)="guardarAsignacion()"
                            [loading]="savingAsignacion()"
                            class="w-full"
                        />
                    </div>
                </div>

                <!-- Tabla Asignaciones -->
                <p-table [value]="asignaciones()" dataKey="idEmpleado" [loading]="loadingAsignaciones()" [tableStyle]="{ 'min-width': '45rem' }">
                    <ng-template #header>
                        <tr>
                            <th>No. Empleado</th>
                            <th>Empleado</th>
                            <th>Tipo relación</th>
                            <th>Estado</th>
                            <th></th>
                        </tr>
                    </ng-template>
                    <ng-template #body let-asig>
                        <tr>
                            <td class="font-mono">{{ asig.numeroEmpleado }}</td>
                            <td>{{ asig.nombreEmpleado }}</td>
                            <td>{{ asig.clTipoRelacion }}</td>
                            <td>
                                <p-tag [value]="asig.clEstatusAsignacion === 'ACTIVO' ? 'Activo' : 'Inactivo'" [severity]="asig.clEstatusAsignacion === 'ACTIVO' ? 'success' : 'danger'" />
                            </td>
                            <td>
                                <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (onClick)="editarAsignacion(asig)" pTooltip="Editar" />
                                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="confirmarEliminarAsignacion(asig)" pTooltip="Eliminar" />
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template #emptymessage>
                        <tr>
                            <td colspan="5" class="text-center text-surface-500">No hay asignaciones para este cliente.</td>
                        </tr>
                    </ng-template>
                </p-table>
            </ng-template>
        </p-dialog>
    `
})
export class Clientes implements OnInit {
    private readonly clientesService = inject(ClientesApiService);
    private readonly clientesDireccionesService = inject(ClientesDireccionesApiService);
    private readonly asignacionesService = inject(AsignacionesApiService);
    private readonly empleadosService = inject(EmpleadosApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly catalogosService = inject(CatalogosMaestrosService);
    private readonly catalogosGenService = inject(CatalogosApiService);
    private readonly destroyRef = inject(DestroyRef);

    // ─── State principal ───
    clientes = signal<Cliente[]>([]);
    loading = signal<boolean>(false);
    saving = signal<boolean>(false);

    // ─── Catálogos ───
    paises = signal<Pais[]>([]);
    estadosFiltrados = signal<Estado[]>([]);

    // ─── Options ───
    tipoOptions = [
        { label: 'Distribuidor', value: 'Distribuidor' },
        { label: 'Mayorista', value: 'Mayorista' },
        { label: 'Minorista', value: 'Minorista' },
        { label: 'Directo', value: 'Directo' }
    ];

    monedaOptions = signal<{label: string, value: string}[]>([]);

    private searchSubject = new Subject<{table: Table, query: string}>();

    // ─── CREAR CLIENTE ───
    crearDialogVisible = false;
    submitted = signal<boolean>(false);
    nuevoCliente: CrearClienteRequest = this.emptyCliente();

    // ─── EDITAR CLIENTE ───
    editarDialogVisible = false;
    submittedEditar = signal<boolean>(false);
    clienteEditandoId = '';
    datosEditar: ActualizarClienteRequest = this.emptyCliente();

    // ─── DIRECCIONES ───
    direccionesDialogVisible = false;
    clienteSeleccionadoId = signal<string>('');
    clienteSeleccionadoNombre = signal<string>('');
    direcciones = signal<DireccionCliente[]>([]);
    loadingDirecciones = signal<boolean>(false);
    savingDireccion = signal<boolean>(false);
    direccionEditandoId = signal<string>('');
    direccionFormData: CrearDireccionClienteRequest = this.emptyDireccion();

    // ─── ASIGNACIONES ───
    asignacionesDialogVisible = false;
    asignaciones = signal<AsignacionClienteEmpleado[]>([]);
    loadingAsignaciones = signal<boolean>(false);
    savingAsignacion = signal<boolean>(false);
    empleadosActivos = signal<Empleado[]>([]);
    loadingEmpleados = signal<boolean>(false);
    asignacionEditandoId = signal<string>('');
    asignacionFormData = { idEmpleado: '', clTipoRelacion: 'Responsable', activo: true };

    empleadoOptions = computed(() => {
        const activas = this.empleadosActivos().map((e) => ({
            value: e.idUsuario,
            label: `${e.clEmpleado} — ${e.nbEmpleado} ${e.nbApellidos}`
        }));

        const editId = this.asignacionEditandoId();

        if (!editId || activas.some((o) => o.value === editId)) {
            return activas;
        }

        const asig = this.asignaciones().find((a) => a.idEmpleado === editId);

        if (!asig) {
            return activas;
        }

        return [
            { value: asig.idEmpleado, label: `${asig.numeroEmpleado} — ${asig.nombreEmpleado} (inactivo)` },
            ...activas
        ];
    });

    ngOnInit(): void {
        this.cargarClientes();
        this.cargarEmpleadosActivos();
        this.cargarPaises();
        this.cargarMonedas();

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged((prev, curr) => prev.query === curr.query),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(({table, query}) => {
            table.filterGlobal(query, 'contains');
        });
    }

    cargarMonedas(): void {
        this.catalogosGenService.getElementos('MONEDAS').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                const options = (data || []).map(m => ({ label: m.nbCatalogoElemento, value: m.clCatalogoElemento }));

                this.monedaOptions.set(options);
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las monedas.' })
        });
    }

    cargarPaises(): void {
        this.catalogosService.getPaises(true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => this.paises.set(data),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los países.' })
        });
    }

    onPaisChange(codigoISO: string): void {
        const pais = this.paises().find(p => p.codigoISO === codigoISO);

        if (pais) {
            this.catalogosService.getEstados(pais.id, true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                next: (data) => {
                    this.estadosFiltrados.set(data);
                    // Si el estado actual no está en la nueva lista, lo limpiamos

                    if (!data.some(e => e.nombre === this.direccionFormData.estado)) {
                        this.direccionFormData.estado = '';
                    }
                }
            });
        } else {
            this.estadosFiltrados.set([]);
            this.direccionFormData.estado = '';
        }
    }

    // ═══════════════════════════════════════════
    // LISTADO
    // ═══════════════════════════════════════════

    cargarClientes(): void {
        this.loading.set(true);

        this.clientesService.getClientes().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => {
                this.clientes.set(r);
                this.loading.set(false);
            },
            error: (err: HttpErrorResponse) => {
                this.loading.set(false);
                let detail: string;

                if (err.status === 0) {
                    detail = 'No se pudo conectar con el backend.';
                } else if (err.status === 401) {
                    detail = 'Sesión expirada. Inicia sesión nuevamente.';
                } else if (err.status === 403) {
                    detail = 'No tienes permisos para consultar clientes.';
                } else {
                    detail = `Error al cargar clientes (${err.status}).`;
                }

                this.messageService.add({ severity: 'error', summary: 'Error de carga', detail, life: 5000 });
            }
        });
    }

    onGlobalFilter(table: Table, event: Event): void {
        this.searchSubject.next({ table, query: (event.target as HTMLInputElement).value });
    }

    cargarEmpleadosActivos(): void {
        this.loadingEmpleados.set(true);
        this.empleadosService.getEmpleados().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => {
                this.empleadosActivos.set(r.filter((e) => e.activo));
                this.loadingEmpleados.set(false);
            },
            error: () => {
                this.loadingEmpleados.set(false);
                this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'No se pudieron cargar los empleados activos.', life: 4000 });
            }
        });
    }

    // ═══════════════════════════════════════════
    // CREAR CLIENTE
    // ═══════════════════════════════════════════

    abrirCrearCliente(): void {
        this.nuevoCliente = this.emptyCliente();
        this.submitted.set(false);
        this.crearDialogVisible = true;
    }

    guardarNuevoCliente(): void {
        this.submitted.set(true);

        if (!this.nuevoCliente.nombreComercial?.trim() || !this.nuevoCliente.canalVenta?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Completa los campos obligatorios.', life: 4000 });

            return;
        }

        this.saving.set(true);

        this.clientesService.crearCliente(this.nuevoCliente).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (cli) => {
                this.saving.set(false);
                this.crearDialogVisible = false;
                this.cargarClientes();
                this.messageService.add({ severity: 'success', summary: 'Cliente creado', detail: `${cli.nombreComercial} fue registrado correctamente.`, life: 4000 });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);

                const detail = err.error?.detail || err.error?.title || 'No se pudo crear el cliente.';

                this.messageService.add({ severity: 'error', summary: 'Error al crear', detail, life: 5000 });
            }
        });
    }

    // ═══════════════════════════════════════════
    // EDITAR CLIENTE
    // ═══════════════════════════════════════════

    abrirEditarCliente(cliente: Cliente): void {
        this.clienteEditandoId = cliente.id;
        this.datosEditar = {
            nombreComercial: cliente.nombreComercial,
            tipo: cliente.tipo,
            // Intentamos mapear moneda (nombre o código) al id del catálogo si está disponible
            moneda: (() => {
                const monedas = this.monedasRaw();
                const found = monedas.find((m: any) => m.clCatalogoElemento === cliente.moneda || m.nbCatalogoElemento === cliente.moneda);

                return found ? found.id : cliente.moneda;
            })(),
            canalVenta: cliente.canalVenta,
            limiteCredito: cliente.limiteCredito,
            activo: cliente.activo
        };
        this.submittedEditar.set(false);
        this.editarDialogVisible = true;
    }

    guardarEdicionCliente(): void {
        this.submittedEditar.set(true);

        if (!this.datosEditar.nombreComercial?.trim() || !this.datosEditar.canalVenta?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Nombre comercial y canal de venta son obligatorios.', life: 4000 });

            return;
        }

        // Mapear moneda seleccionada al id si es posible
        const selected = this.datosEditar.moneda as any;
        let idElemMoneda: number | undefined;

        if (typeof selected === 'number' && selected > 0) {
            idElemMoneda = Number(selected);
        } else if (typeof selected === 'string') {
            const found = this.monedasRaw().find((m: any) => m.clCatalogoElemento === selected || m.nbCatalogoElemento === selected);

            if (found) idElemMoneda = found.id;
        }

        this.saving.set(true);

        const payload: any = {
            nombreComercial: this.datosEditar.nombreComercial?.trim(),
            tipo: this.datosEditar.tipo,
            idElemMoneda: idElemMoneda ? Number(idElemMoneda) : undefined,
            canalVenta: this.datosEditar.canalVenta?.trim(),
            limiteCredito: Number(this.datosEditar.limiteCredito ?? 0),
            activo: this.datosEditar.activo
        };

        this.clientesService.actualizarCliente(this.clienteEditandoId, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (cli) => {
                this.saving.set(false);
                this.editarDialogVisible = false;
                this.cargarClientes();
                this.messageService.add({ severity: 'success', summary: 'Cliente actualizado', detail: `${cli.nombreComercial} fue actualizado correctamente.`, life: 4000 });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);

                const detail = err.error?.detail || err.error?.title || 'No se pudo actualizar el cliente.';

                this.messageService.add({ severity: 'error', summary: 'Error al actualizar', detail, life: 5000 });
            }
        });
    }

    // ═══════════════════════════════════════════
    // DESACTIVAR / ACTIVAR (eliminación lógica)
    // ═══════════════════════════════════════════

    confirmarDesactivar(cliente: Cliente): void {
        this.confirmationService.confirm({
            message: `¿Estás seguro de desactivar a ${cliente.nombreComercial}?`,
            header: 'Confirmar desactivación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, desactivar',
            rejectLabel: 'No',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                // Mapear moneda del cliente al id de catálogo si está disponible
                const monedas = this.monedasRaw();
                const found = monedas.find((m: any) => m.clCatalogoElemento === cliente.moneda || m.nbCatalogoElemento === cliente.moneda);
                const payload: any = {
                    nombreComercial: cliente.nombreComercial,
                    tipo: cliente.tipo,
                    idElemMoneda: found ? found.id : undefined,
                    canalVenta: cliente.canalVenta,
                    limiteCredito: cliente.limiteCredito,
                    activo: false
                };

                this.clientesService.actualizarCliente(cliente.id, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargarClientes();
                        this.messageService.add({ severity: 'success', summary: 'Desactivado', detail: `${cliente.nombreComercial} fue desactivado.`, life: 4000 });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar al cliente.', life: 5000 })
                });
            }
        });
    }

    confirmarActivar(cliente: Cliente): void {
        this.confirmationService.confirm({
            message: `¿Reactivar a ${cliente.nombreComercial}?`,
            header: 'Confirmar reactivación',
            icon: 'pi pi-check-circle',
            acceptLabel: 'Sí, reactivar',
            rejectLabel: 'No',
            accept: () => {
                const monedas = this.monedasRaw();
                const found = monedas.find((m: any) => m.clCatalogoElemento === cliente.moneda || m.nbCatalogoElemento === cliente.moneda);
                const payload: any = {
                    nombreComercial: cliente.nombreComercial,
                    tipo: cliente.tipo,
                    idElemMoneda: found ? found.id : undefined,
                    canalVenta: cliente.canalVenta,
                    limiteCredito: cliente.limiteCredito,
                    activo: true
                };

                this.clientesService.actualizarCliente(cliente.id, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargarClientes();
                        this.messageService.add({ severity: 'success', summary: 'Reactivado', detail: `${cliente.nombreComercial} fue reactivado.`, life: 4000 });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reactivar al cliente.', life: 5000 })
                });
            }
        });
    }

    // ═══════════════════════════════════════════
    // DIRECCIONES
    // ═══════════════════════════════════════════

    abrirDirecciones(cliente: Cliente): void {
        this.clienteSeleccionadoId.set(cliente.id);
        this.clienteSeleccionadoNombre.set(cliente.nombreComercial);
        this.limpiarDireccionForm();
        this.direccionesDialogVisible = true;
        this.cargarDirecciones(cliente.id);
    }

    cargarDirecciones(idCliente: string): void {
        this.loadingDirecciones.set(true);
        this.clientesDireccionesService.getDirecciones(idCliente).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => { this.direcciones.set(r); this.loadingDirecciones.set(false); },
            error: () => {
                this.loadingDirecciones.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las direcciones.', life: 5000 });
            }
        });
    }

    editarDireccion(dir: DireccionCliente): void {
        this.direccionEditandoId.set(dir.id);
        this.direccionFormData = {
            alias: dir.alias,
            linea1: dir.linea1,
            linea2: dir.linea2,
            ciudad: dir.ciudad,
            estado: dir.estado,
            codigoPostal: dir.codigoPostal,
            pais: dir.pais,
            esPrincipal: dir.esPrincipal
        };
        // Cargamos estados para el país de la dirección si existe

        if (dir.pais) {
            this.onPaisChange(dir.pais);
        }
    }

    limpiarDireccionForm(): void {
        this.direccionEditandoId.set('');
        this.direccionFormData = this.emptyDireccion();
    }

    guardarDireccion(): void {
        const idCliente = this.clienteSeleccionadoId();

        if (!idCliente) {
            return;
        }

        if (!this.direccionFormData.alias?.trim() || !this.direccionFormData.linea1?.trim() ||
            !this.direccionFormData.ciudad?.trim() || !this.direccionFormData.estado?.trim() ||
            !this.direccionFormData.codigoPostal?.trim() || !this.direccionFormData.pais?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Completa todos los campos de dirección obligatorios.', life: 4000 });

            return;
        }

        this.savingDireccion.set(true);
        const idDireccion = this.direccionEditandoId();

        const request$ = idDireccion
            ? this.clientesDireccionesService.actualizarDireccion(idCliente, idDireccion, this.direccionFormData)
            : this.clientesDireccionesService.crearDireccion(idCliente, this.direccionFormData);

        request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.savingDireccion.set(false);
                this.limpiarDireccionForm();
                this.cargarDirecciones(idCliente);
                this.messageService.add({
                    severity: 'success',
                    summary: idDireccion ? 'Dirección actualizada' : 'Dirección creada',
                    detail: 'La dirección fue guardada correctamente.',
                    life: 4000
                });
            },
            error: (err: HttpErrorResponse) => {
                this.savingDireccion.set(false);

                const detail = err.error?.detail || err.error?.title || 'No se pudo guardar la dirección.';

                this.messageService.add({ severity: 'error', summary: 'Error', detail: detail, life: 7000 });
            }
        });
    }

    // ═══════════════════════════════════════════
    // ASIGNACIONES
    // ═══════════════════════════════════════════

    abrirAsignaciones(cliente: Cliente): void {
        this.clienteSeleccionadoId.set(cliente.id);
        this.clienteSeleccionadoNombre.set(cliente.nombreComercial);
        this.limpiarAsignacionForm();
        this.asignacionesDialogVisible = true;
        this.cargarAsignaciones(cliente.id);
    }

    cargarAsignaciones(idCliente: string): void {
        this.loadingAsignaciones.set(true);
        this.asignacionesService.getAsignacionesPorCliente(idCliente).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (r) => { this.asignaciones.set(r); this.loadingAsignaciones.set(false); },
            error: () => {
                this.loadingAsignaciones.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las asignaciones.', life: 5000 });
            }
        });
    }

    editarAsignacion(asig: AsignacionClienteEmpleado): void {
        this.asignacionEditandoId.set(asig.idEmpleado);
        this.asignacionFormData = {
            idEmpleado: asig.idEmpleado,
            clTipoRelacion: asig.clTipoRelacion,
            activo: asig.clEstatusAsignacion === 'ACTIVO'
        };
    }

    limpiarAsignacionForm(): void {
        this.asignacionEditandoId.set('');
        this.asignacionFormData = { idEmpleado: '', clTipoRelacion: 'Responsable', activo: true };
    }

    guardarAsignacion(): void {
        const idCliente = this.clienteSeleccionadoId();

        if (!idCliente) {
            return;
        }

        if (!this.asignacionFormData.idEmpleado || !this.asignacionFormData.clTipoRelacion?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Selecciona un empleado y tipo de relación.', life: 4000 });

            return;
        }

        const editId = this.asignacionEditandoId();

        // Validación de creación
        if (!editId) {
            const esActivo = this.empleadosActivos().some((e) => e.idUsuario === this.asignacionFormData.idEmpleado);

            if (!esActivo) {
                this.messageService.add({ severity: 'warn', summary: 'Empleado inválido', detail: 'Selecciona un empleado activo.', life: 4000 });

                return;
            }

            const duplicada = this.asignaciones().some((a) => a.idEmpleado === this.asignacionFormData.idEmpleado);

            if (duplicada) {
                this.messageService.add({ severity: 'warn', summary: 'Duplicado', detail: 'Ya existe una asignación para este empleado.', life: 4000 });

                return;
            }
        }

        this.savingAsignacion.set(true);

        const request$ = editId
            ? this.asignacionesService.actualizarAsignacion(editId, idCliente, {
                  clTipoRelacion: this.asignacionFormData.clTipoRelacion,
                  clEstatusAsignacion: this.asignacionFormData.activo ? 'ACTIVO' : 'INACTIVO'
              })
            : this.asignacionesService.crearAsignacion({
                  idEmpleado: this.asignacionFormData.idEmpleado,
                  idCliente,
                  clTipoRelacion: this.asignacionFormData.clTipoRelacion
              } as CrearAsignacionClienteEmpleadoRequest);

        request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.savingAsignacion.set(false);
                this.limpiarAsignacionForm();
                this.cargarAsignaciones(idCliente);
                this.messageService.add({
                    severity: 'success',
                    summary: editId ? 'Asignación actualizada' : 'Asignación creada',
                    detail: 'La asignación fue guardada correctamente.',
                    life: 4000
                });
            },
            error: (err: HttpErrorResponse) => {
                this.savingAsignacion.set(false);
                let detail = 'No se pudo guardar la asignación.';

                if (err.status === 409) detail = 'La asignación ya existe para este cliente y empleado.';
                if (err.status === 404) detail = 'No se encontró el cliente o empleado.';

                this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
            }
        });
    }

    confirmarEliminarAsignacion(asig: AsignacionClienteEmpleado): void {
        this.confirmationService.confirm({
            message: `¿Eliminar la asignación de ${asig.nombreEmpleado}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'No',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.asignacionesService.eliminarAsignacion(asig.idEmpleado, asig.idCliente).pipe(
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe({
                    next: () => {
                        const idCliente = this.clienteSeleccionadoId();

                        if (idCliente) {
                            this.cargarAsignaciones(idCliente);
                        }

                        this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: `La asignación de ${asig.nombreEmpleado} fue eliminada.`, life: 4000 });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la asignación.', life: 5000 })
                });
            }
        });
    }

    // ═══════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════

    private emptyCliente(): CrearClienteRequest {
        return { nombreComercial: '', tipo: 'Distribuidor', moneda: 0, canalVenta: '', limiteCredito: 0, activo: true };
    }

    private emptyDireccion(): CrearDireccionClienteRequest {
        return { alias: '', linea1: '', linea2: '', ciudad: '', estado: '', codigoPostal: '', pais: '', esPrincipal: false };
    }
}
