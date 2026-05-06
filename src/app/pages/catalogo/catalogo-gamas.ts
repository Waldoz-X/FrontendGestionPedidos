import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Table, TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';

import { Gama, CrearGamaRequest, GetGamasQuery } from '../service/catalogo-api.types';
import { CatalogoService } from '../service/catalogo.service';

@Component({
    selector: 'p-catalogo-gamas',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
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
                        <div class="font-semibold text-xl">Gamas de Catálogo</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Gestión de gamas de productos del catálogo.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nueva" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarGamas()" [loading]="loadingGamas()" />
                </ng-template>
            </p-toolbar>

            <!-- ═══ FILTROS ═══ -->
            <div class="grid grid-cols-12 gap-4 mb-4">
                <div class="col-span-12 md:col-span-3">
                    <p-select
                        [options]="estadoFiltroOptions"
                        optionLabel="label"
                        optionValue="value"
                        [(ngModel)]="filtroActivo"
                        [ngModelOptions]="{ standalone: true }"
                        placeholder="Estado"
                        class="w-full"
                        appendTo="body"
                    />
                </div>
                <div class="col-span-12 md:col-span-3 flex gap-2">
                    <p-button label="Filtrar" icon="pi pi-filter" severity="secondary" (onClick)="cargarGamas()" />
                </div>
            </div>

            <!-- ═══ TABLA GAMAS ═══ -->
            <p-table
                #dt
                [value]="gamas()"
                dataKey="id"
                [loading]="loadingGamas()"
                [paginator]="true"
                [rows]="10"
                [rowsPerPageOptions]="[10, 20, 50]"
                [globalFilterFields]="['nombre', 'descripcion']"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} gamas"
                [showCurrentPageReport]="true"
                [rowHover]="true"
            >
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
                        <th pSortableColumn="nombre" style="min-width: 14rem">Nombre <p-sortIcon field="nombre" /></th>
                        <th style="min-width: 20rem">Descripción</th>
                        <th pSortableColumn="activo" style="min-width: 8rem">Estado <p-sortIcon field="activo" /></th>
                        <th pSortableColumn="creadoEn" style="min-width: 10rem">Creado <p-sortIcon field="creadoEn" /></th>
                        <th style="min-width: 12rem"></th>
                    </tr>
                </ng-template>

                <ng-template #body let-gama>
                    <tr>
                        <td class="font-medium">{{ gama.nombre }}</td>
                        <td class="text-surface-600 dark:text-surface-400">{{ gama.descripcion || '—' }}</td>
                        <td>
                            <p-tag
                                [value]="gama.activo ? 'Activo' : 'Inactivo'"
                                [severity]="gama.activo ? 'success' : 'danger'"
                            />
                        </td>
                        <td class="text-sm text-surface-500">{{ gama.creadoEn | date: 'dd/MM/yyyy' }}</td>
                        <td>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editarGama(gama)" pTooltip="Editar" />
                                @if (!gama.activo) {
                                    <p-button
                                        icon="pi pi-check-circle"
                                        severity="success"
                                        [rounded]="true"
                                        [outlined]="true"
                                        (onClick)="activarGama(gama)"
                                        pTooltip="Activar"
                                    />
                                }
                                <p-button
                                    icon="pi pi-trash"
                                    [rounded]="true"
                                    [outlined]="true"
                                    severity="danger"
                                    (onClick)="confirmarEliminar(gama)"
                                    pTooltip="Eliminar"
                                />
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template #emptymessage>
                    <tr>
                        <td colspan="5">No hay gamas registradas con los filtros actuales.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO GAMA (CREAR/EDITAR) ═══ -->
        <p-dialog
            [(visible)]="gamaDialog"
            [style]="{ width: '480px' }"
            [header]="gamaEditandoId() ? 'Editar Gama' : 'Nueva Gama'"
            [modal]="true"
        >
            <ng-template #content>
                <form [formGroup]="gamaForm" class="flex flex-col gap-5 mt-2 pb-2">

                    <div>
                        <label for="nombre" class="block font-bold mb-2">Nombre <span class="text-red-500">*</span></label>
                        <input pInputText id="nombre" formControlName="nombre" fluid autofocus placeholder="Ej: Prime" />
                        @if (gamaForm.get('nombre')?.invalid && (gamaForm.get('nombre')?.dirty || gamaForm.get('nombre')?.touched)) {
                            <small class="text-red-500 block mt-1">El nombre es requerido.</small>
                        }
                    </div>

                    <div>
                        <label for="descripcion" class="block font-bold mb-2">Descripción</label>
                        <textarea
                            pTextarea
                            id="descripcion"
                            formControlName="descripcion"
                            [rows]="3"
                            class="w-full"
                            placeholder="Descripción opcional de la gama..."
                        ></textarea>
                    </div>

                    <div class="flex items-center gap-2">
                        <p-checkbox inputId="activo" formControlName="activo" [binary]="true" />
                        <label for="activo" class="font-bold">Activo</label>
                    </div>
                </form>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="gamaDialog = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarGama()" [loading]="savingGama()" />
            </ng-template>
        </p-dialog>
    `
})
export class CatalogoGamas implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly catalogoService = inject(CatalogoService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    // ─── State ───
    gamas = signal<Gama[]>([]);

    // ─── Loaders ───
    loadingGamas = signal<boolean>(false);
    savingGama = signal<boolean>(false);

    // ─── Dialog Visibility ───
    gamaDialog = false;

    // ─── Selected ───
    gamaEditandoId = signal<string>('');

    // ─── Filters ───
    filtroActivo: string = 'activos';

    estadoFiltroOptions = [
        { value: 'todos', label: 'Todos' },
        { value: 'activos', label: 'Solo activos' },
        { value: 'inactivos', label: 'Solo inactivos' }
    ];

    // ─── Form ───
    gamaForm = this.fb.nonNullable.group({
        nombre: ['', [Validators.required, Validators.maxLength(200)]],
        descripcion: [''],
        activo: [true]
    });

    ngOnInit(): void {
        this.cargarGamas();
    }

    onGlobalFilter(table: Table, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    // ═══ CARGAR ═══

    cargarGamas(): void {
        this.loadingGamas.set(true);
        const query: GetGamasQuery = {
            activo: this.mapEstadoFiltro(this.filtroActivo)
        };

        this.catalogoService.getGamas(query).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => {
                this.gamas.set(data);
                this.loadingGamas.set(false);
            },
            error: (e: HttpErrorResponse) => {
                this.loadingGamas.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: `No se pudieron cargar las gamas (${e.status || 0}).`,
                    life: 5000
                });
            }
        });
    }

    // ═══ CREAR / EDITAR ═══

    abrirNuevo(): void {
        this.gamaEditandoId.set('');
        this.gamaForm.reset({ nombre: '', descripcion: '', activo: true });
        this.gamaForm.markAsUntouched();
        this.gamaDialog = true;
    }

    editarGama(gama: Gama): void {
        this.gamaEditandoId.set(gama.id);
        this.gamaForm.reset({
            nombre: gama.nombre,
            descripcion: gama.descripcion ?? '',
            activo: gama.activo
        });
        this.gamaDialog = true;
    }

    guardarGama(): void {
        if (this.gamaForm.invalid) {
            this.gamaForm.markAllAsTouched();
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario Incompleto',
                detail: 'Por favor completa los campos requeridos.',
                life: 4000
            });

            return;
        }

        this.savingGama.set(true);
        const raw = this.gamaForm.getRawValue();
        const payload: CrearGamaRequest = {
            nombre: raw.nombre,
            descripcion: raw.descripcion,
            activo: raw.activo
        };
        const id = this.gamaEditandoId();

        const request$ = id
            ? this.catalogoService.actualizarGama(id, payload)
            : this.catalogoService.crearGama(payload);

        request$.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.savingGama.set(false);
                this.gamaDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: id ? 'Gama actualizada correctamente.' : 'Gama creada correctamente.',
                    life: 3000
                });
                this.cargarGamas();
            },
            error: (e: HttpErrorResponse) => {
                this.savingGama.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: `Ocurrió un problema al guardar la gama (${e.status || 0}).`,
                    life: 5000
                });
            }
        });
    }

    // ═══ ACTIVAR ═══

    activarGama(gama: Gama): void {
        this.catalogoService.activarGama(gama.id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Activada',
                    detail: `La gama "${gama.nombre}" fue activada correctamente.`,
                    life: 3000
                });
                this.cargarGamas();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo activar la gama.',
                    life: 5000
                });
            }
        });
    }

    // ═══ ELIMINAR ═══

    confirmarEliminar(gama: Gama): void {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar la gama <b>${gama.nombre}</b>? Esta acción no se puede deshacer.`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.catalogoService.eliminarGama(gama.id).pipe(
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Eliminada',
                            detail: `La gama "${gama.nombre}" fue eliminada correctamente.`,
                            life: 3000
                        });
                        this.cargarGamas();
                    },
                    error: (e: HttpErrorResponse) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: `No se pudo eliminar la gama (${e.status || 0}).`,
                            life: 5000
                        });
                    }
                });
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
