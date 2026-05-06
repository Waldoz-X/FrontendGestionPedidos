import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Cliente, ClienteUsuario, CrearClienteUsuarioRequest } from '../service/clientes-api.types';
import { ClientesService } from '../service/clientes.service';

interface ClienteCuentaRow {
    cliente: Cliente;
    usuarioPrincipal: ClienteUsuario | null;
    totalUsuarios: number;
}

@Component({
    selector: 'p-admin-clientes-usuarios',
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
        IconFieldModule,
        InputIconModule,
        PasswordModule,
        TooltipModule
    ],
    providers: [MessageService],
    template: `
        <p-toast />

        <div class="card">
            <!-- ═══ TOOLBAR ═══ -->
            <p-toolbar class="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Usuarios de Clientes</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Creación de cuentas y restablecimiento de contraseñas por cliente.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nuevo usuario" icon="pi pi-user-plus" severity="secondary" class="mr-2" (onClick)="abrirCrearUsuario()" [disabled]="!clienteSeleccionadoId" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="recargar()" [loading]="loadingUsuarios()" />
                </ng-template>
            </p-toolbar>

            <!-- ═══ SELECTOR DE CLIENTE ═══ -->
            <div class="grid grid-cols-12 gap-4 mb-6">
                <div class="col-span-12 md:col-span-6">
                    <label class="block font-bold mb-3">Seleccionar cliente</label>
                    <p-select
                        [(ngModel)]="clienteSeleccionadoId"
                        [options]="clienteOptions()"
                        optionLabel="label"
                        optionValue="value"
                        [filter]="true"
                        filterBy="label"
                        placeholder="Buscar cliente..."
                        [showClear]="true"
                        class="w-full"
                        (onChange)="onClienteChange()"
                    />
                </div>
            </div>

            <!-- ═══ TABLA USUARIOS ═══ -->
            <p-table
                #dt
                [value]="usuarios()"
                dataKey="idUsuario"
                [loading]="loadingUsuarios()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
                [showCurrentPageReport]="true"
                [globalFilterFields]="['email']"
                [tableStyle]="{ 'min-width': '50rem' }"
                [rowHover]="true"
            >
                <ng-template #caption>
                    <div class="flex items-center justify-between">
                        <span></span>
                        <p-iconfield>
                            <p-inputicon class="pi pi-search" />
                            <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar por email..." />
                        </p-iconfield>
                    </div>
                </ng-template>
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="email" style="min-width: 20rem">Email <p-sortIcon field="email" /></th>
                        <th pSortableColumn="activo" style="min-width: 8rem">Estado <p-sortIcon field="activo" /></th>
                        <th style="min-width: 12rem">Roles</th>
                        <th style="min-width: 8rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-u>
                    <tr>
                        <td class="font-medium">{{ u.email }}</td>
                        <td>
                            <p-tag [value]="u.activo ? 'Activo' : 'Inactivo'" [severity]="u.activo ? 'success' : 'danger'" />
                        </td>
                        <td>
                            @for (role of u.roles; track role) {
                                <p-tag [value]="role" severity="info" class="mr-1" />
                            }
                            @if (!u.roles || u.roles.length === 0) {
                                <span class="text-surface-500">—</span>
                            }
                        </td>
                        <td>
                            <p-button icon="pi pi-key" [rounded]="true" [outlined]="true" severity="secondary" (onClick)="abrirCambioPassword(u)" pTooltip="Cambiar contraseña" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template #empty>
                    <tr>
                        <td colspan="4" class="text-center text-surface-500">
                            @if (!clienteSeleccionadoId) {
                                Selecciona un cliente para ver sus usuarios.
                            } @else {
                                No hay usuarios registrados para este cliente.
                            }
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO CREAR USUARIO ═══ -->
        <p-dialog
            [(visible)]="crearDialogVisible"
            [style]="{ width: '500px' }"
            [header]="'Nuevo usuario — ' + clienteSeleccionadoNombre"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label class="block font-bold mb-3">Cliente</label>
                        <span class="text-lg">{{ clienteSeleccionadoNombre }}</span>
                    </div>
                    <div>
                        <label for="cli_email" class="block font-bold mb-3">Email</label>
                        <input type="email" pInputText id="cli_email" [(ngModel)]="nuevoUsuario.email" placeholder="usuario@cliente.com" fluid />
                        @if (submitted() && !nuevoUsuario.email) {
                            <small class="text-red-500">El email es requerido.</small>
                        }
                    </div>
                    <div>
                        <label for="cli_password" class="block font-bold mb-3">Contraseña temporal</label>
                        <p-password inputId="cli_password" [(ngModel)]="nuevoUsuario.password" [toggleMask]="true" [feedback]="false" class="w-full" />
                        @if (submitted() && !nuevoUsuario.password) {
                            <small class="text-red-500">La contraseña es requerida (mín. 8 caracteres).</small>
                        }
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="crearDialogVisible = false" />
                <p-button label="Crear cuenta" icon="pi pi-check" (onClick)="guardarUsuario()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <!-- ═══ DIALOGO CAMBIAR CONTRASEÑA ═══ -->
        <p-dialog
            [(visible)]="passwordDialogVisible"
            [style]="{ width: '450px' }"
            [header]="'Cambiar contraseña — ' + selectedEmail"
            [modal]="true"
        >
            <ng-template #content>
                <div class="flex flex-col gap-6">
                    <div>
                        <label class="block font-bold mb-3">Email</label>
                        <span class="text-lg">{{ selectedEmail }}</span>
                    </div>
                    <div>
                        <label for="pwd_new" class="block font-bold mb-3">Nueva contraseña</label>
                        <p-password inputId="pwd_new" [(ngModel)]="nuevaPassword" [toggleMask]="true" [feedback]="false" class="w-full" />
                        @if (submittedPwd() && !nuevaPassword) {
                            <small class="text-red-500">La contraseña es requerida (mín. 8 caracteres).</small>
                        }
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="passwordDialogVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarCambioPassword()" [loading]="saving()" />
            </ng-template>
        </p-dialog>
    `
})
export class AdminClientesUsuarios implements OnInit {
    private readonly clientesService = inject(ClientesService);
    private readonly messageService = inject(MessageService);
    private readonly destroyRef = inject(DestroyRef);

    // ─── State ───
    clientesConCuenta = signal<ClienteCuentaRow[]>([]);
    loading = signal(false);
    loadingUsuarios = signal(false);
    saving = signal(false);
    usuarios = signal<ClienteUsuario[]>([]);

    clienteSeleccionadoId = '';
    clienteSeleccionadoNombre = '';

    // ─── Crear usuario ───
    crearDialogVisible = false;
    submitted = signal(false);
    nuevoUsuario: CrearClienteUsuarioRequest = { email: '', password: '' };

    // ─── Cambiar password ───
    passwordDialogVisible = false;
    submittedPwd = signal(false);
    selectedIdClientePassword = '';
    selectedIdUsuario = '';
    selectedEmail = '';
    nuevaPassword = '';

    ngOnInit(): void {
        this.cargarClientes();
    }

    // ═══ CARGA ═══

    cargarClientes(): void {
        this.loading.set(true);

        this.clientesService
            .getClientes()
            .pipe(
                switchMap((clientes) => {
                    if (!clientes.length) {
                        return of([] as ClienteCuentaRow[]);
                    }

                    const requests = clientes.map((cliente) =>
                        this.clientesService.getUsuariosCliente(cliente.id).pipe(
                            map((usuarios) => ({
                                cliente,
                                usuarioPrincipal: this.resolveUsuarioPrincipal(usuarios),
                                totalUsuarios: usuarios.length
                            })),
                            catchError(() =>
                                of({
                                    cliente,
                                    usuarioPrincipal: null,
                                    totalUsuarios: 0
                                })
                            )
                        )
                    );

                    return forkJoin(requests);
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: (rows) => {
                    this.clientesConCuenta.set(rows);

                    const clienteSeleccionado = rows.find((row) => row.cliente.id === this.clienteSeleccionadoId);

                    if (!clienteSeleccionado) {
                        this.clienteSeleccionadoId = '';
                        this.clienteSeleccionadoNombre = '';
                        this.usuarios.set([]);
                    } else {
                        this.clienteSeleccionadoNombre = clienteSeleccionado.cliente.nombreComercial;
                    }

                    this.loading.set(false);
                },
                error: (err: HttpErrorResponse) => {
                    this.loading.set(false);
                    const detail = err.status === 0 ? 'No se pudo conectar con el backend.' : 'No se pudieron cargar los clientes.';

                    this.messageService.add({ severity: 'error', summary: 'Error de carga', detail, life: 5000 });
                }
            });
    }

    onGlobalFilter(table: Table, event: Event): void {
        const input = event.target as HTMLInputElement | null;

        table.filterGlobal(input?.value ?? '', 'contains');
    }

    clienteOptions(): { label: string; value: string }[] {
        return this.clientesConCuenta().map((row) => ({
            label: row.cliente.nombreComercial,
            value: row.cliente.id
        }));
    }

    onClienteChange(): void {
        if (!this.clienteSeleccionadoId) {
            this.clienteSeleccionadoNombre = '';
            this.usuarios.set([]);

            return;
        }

        const cliente = this.clientesConCuenta().find((row) => row.cliente.id === this.clienteSeleccionadoId);

        this.clienteSeleccionadoNombre = cliente?.cliente.nombreComercial ?? '';
        this.cargarUsuariosCliente(this.clienteSeleccionadoId);
    }

    recargar(): void {
        this.cargarClientes();

        if (this.clienteSeleccionadoId) {
            this.cargarUsuariosCliente(this.clienteSeleccionadoId);
        }
    }

    // ═══ CREAR USUARIO ═══

    abrirCrearUsuario(): void {
        if (!this.clienteSeleccionadoId) {
            this.messageService.add({ severity: 'warn', summary: 'Selecciona un cliente', detail: 'Primero selecciona un cliente para crear su usuario.', life: 3000 });

            return;
        }

        if (!this.clienteSeleccionadoNombre) {
            const cliente = this.clientesConCuenta().find((row) => row.cliente.id === this.clienteSeleccionadoId);

            this.clienteSeleccionadoNombre = cliente?.cliente.nombreComercial ?? '';
        }

        this.nuevoUsuario = { email: '', password: '' };
        this.submitted.set(false);
        this.crearDialogVisible = true;
    }

    guardarUsuario(): void {
        this.submitted.set(true);

        if (!this.nuevoUsuario.email?.trim() || !this.nuevoUsuario.password?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Email y contraseña son obligatorios.', life: 4000 });

            return;
        }

        if (this.nuevoUsuario.password.length < 8) {
            this.messageService.add({ severity: 'warn', summary: 'Contraseña corta', detail: 'La contraseña debe tener al menos 8 caracteres.', life: 4000 });

            return;
        }

        this.saving.set(true);

        this.clientesService.crearUsuarioCliente(this.clienteSeleccionadoId, this.nuevoUsuario).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.saving.set(false);
                this.crearDialogVisible = false;
                this.cargarClientes();
                this.cargarUsuariosCliente(this.clienteSeleccionadoId);
                this.messageService.add({ severity: 'success', summary: 'Cuenta creada', detail: `Se creó la cuenta para ${this.clienteSeleccionadoNombre}.`, life: 4000 });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);
                const detail = err.status === 400 ? 'Datos inválidos. Verifica email y contraseña.' : err.status === 409 ? 'Ya existe un usuario con ese email.' : 'No se pudo crear la cuenta.';

                this.messageService.add({ severity: 'error', summary: 'Error al crear', detail, life: 5000 });
            }
        });
    }

    // ═══ CAMBIAR CONTRASEÑA ═══

    abrirCambioPassword(usuario: ClienteUsuario): void {
        if (!this.clienteSeleccionadoId) {
            this.messageService.add({ severity: 'warn', summary: 'Selecciona un cliente', detail: 'Selecciona un cliente antes de cambiar contraseña.', life: 3000 });

            return;
        }

        this.selectedIdClientePassword = this.clienteSeleccionadoId;
        this.selectedIdUsuario = usuario.idUsuario;
        this.selectedEmail = usuario.email;
        this.nuevaPassword = '';
        this.submittedPwd.set(false);
        this.passwordDialogVisible = true;
    }

    guardarCambioPassword(): void {
        this.submittedPwd.set(true);

        if (!this.nuevaPassword?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Campo vacío', detail: 'Ingresa la nueva contraseña.', life: 4000 });

            return;
        }

        if (this.nuevaPassword.length < 8) {
            this.messageService.add({ severity: 'warn', summary: 'Contraseña corta', detail: 'La contraseña debe tener al menos 8 caracteres.', life: 4000 });

            return;
        }

        this.saving.set(true);

        this.clientesService.actualizarPasswordUsuarioCliente(this.selectedIdClientePassword, this.selectedIdUsuario, { password: this.nuevaPassword }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.saving.set(false);
                this.passwordDialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Contraseña actualizada', detail: `Contraseña cambiada para ${this.clienteSeleccionadoNombre}.`, life: 4000 });
            },
            error: (err: HttpErrorResponse) => {
                this.saving.set(false);
                const detail = err.status === 400 ? 'La contraseña no cumple con la política de seguridad.' : 'No se pudo actualizar la contraseña.';

                this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
            }
        });
    }

    private resolveUsuarioPrincipal(usuarios: ClienteUsuario[]): ClienteUsuario | null {
        if (!usuarios.length) {
            return null;
        }

        const usuarioActivo = usuarios.find((u) => u.activo);

        return usuarioActivo ?? usuarios[0];
    }

    private cargarUsuariosCliente(idCliente: string): void {
        this.loadingUsuarios.set(true);

        this.clientesService.getUsuariosCliente(idCliente).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (usuarios) => {
                this.usuarios.set(usuarios);
                this.loadingUsuarios.set(false);
            },
            error: (err: HttpErrorResponse) => {
                this.loadingUsuarios.set(false);
                const detail = err.status === 0 ? 'No se pudo conectar con el backend.' : 'No se pudieron cargar los usuarios del cliente.';

                this.messageService.add({ severity: 'error', summary: 'Error de carga', detail, life: 5000 });
            }
        });
    }
}
