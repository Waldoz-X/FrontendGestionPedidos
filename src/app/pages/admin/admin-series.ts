import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
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
import { CrearSerieRequest, Serie } from '../service/catalogo-api.types';
import { SelectModule } from 'primeng/select';

@Component({
    selector: 'p-admin-series',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        TableModule,
        DialogModule,
        ToastModule,
        ConfirmDialogModule,
        ToolbarModule,
        TagModule,
        IconFieldModule,
        InputIconModule,
        TooltipModule,
        CheckboxModule,
        SelectModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog [style]="{ width: '450px' }" />

        <div class="card">
            <!-- ═══ TOOLBAR ═══ -->
            <p-toolbar class="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Catálogo de Series</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Administra las series disponibles para categorizar los productos.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nueva Serie" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarSeries()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <!-- ═══ FILTROS ═══ -->
            <div class="grid grid-cols-12 gap-4 mb-4">
                <div class="col-span-12 md:col-span-3">
                    <p-select [options]="estadoFiltroOptions" optionLabel="label" optionValue="value" [(ngModel)]="filtroActivo" [ngModelOptions]="{ standalone: true }" placeholder="Estado" class="w-full"></p-select>
                </div>
                <div class="col-span-12 md:col-span-4 flex items-end">
                    <p-button label="Filtrar" icon="pi pi-filter" severity="secondary" (onClick)="cargarSeries()"></p-button>
                </div>
            </div>

            <!-- ═══ TABLA SERIES ═══ -->
            <p-table 
                #dt 
                [value]="series()" 
                dataKey="id" 
                [loading]="loading()" 
                [paginator]="true" 
                [rows]="10" 
                [globalFilterFields]="['codigo', 'nombre']"
                [rowHover]="true">
                
                <ng-template #caption>
                    <div class="flex items-center justify-between">
                        <span></span>
                        <p-iconfield>
                            <p-inputicon class="pi pi-search" />
                            <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
                        </p-iconfield>
                    </div>
                </ng-template>

                <ng-template #header>
                    <tr>
                        <th pSortableColumn="codigo">Código <p-sortIcon field="codigo" /></th>
                        <th pSortableColumn="nombre">Nombre <p-sortIcon field="nombre" /></th>
                        <th pSortableColumn="activo">Estado <p-sortIcon field="activo" /></th>
                        <th style="min-width: 8rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-serie>
                    <tr>
                        <td class="font-medium text-primary">{{ serie.codigo }}</td>
                        <td>{{ serie.nombre }}</td>
                        <td><p-tag [value]="serie.activo ? 'Activa' : 'Inactiva'" [severity]="serie.activo ? 'success' : 'danger'" /></td>
                        <td>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editarSerie(serie)" pTooltip="Editar" />
                                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="eliminarSerie(serie)" pTooltip="Desactivar" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #empty>
                    <tr><td colspan="4">No hay series registradas.</td></tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO SERIE ═══ -->
        <p-dialog [(visible)]="dialogVisible" [style]="{ width: '450px' }" [header]="editId() ? 'Editar Serie' : 'Crear Serie'" [modal]="true">
            <ng-template #content>
                <form [formGroup]="form" class="flex flex-col gap-6 mt-2 pb-2">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12">
                            <label for="codigo" class="block font-bold mb-2">Código (Abrev.)</label>
                            <input pInputText id="codigo" formControlName="codigo" fluid autofocus />
                        </div>
                        <div class="col-span-12">
                            <label for="nombre" class="block font-bold mb-2">Nombre de la Serie</label>
                            <input pInputText id="nombre" formControlName="nombre" fluid />
                        </div>
                        <div class="col-span-12 flex items-center gap-2 mt-2">
                            <p-checkbox inputId="activo" formControlName="activo" [binary]="true" />
                            <label for="activo" class="font-bold">Activa</label>
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
export class AdminSeriesComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly catalogoService = inject(CatalogoService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    series = signal<Serie[]>([]);
    
    loading = signal(false);
    saving = signal(false);
    
    dialogVisible = false;
    editId = signal('');

    filtroActivo: string = 'activos';
    estadoFiltroOptions = [
        { value: 'todos', label: 'Todos' },
        { value: 'activos', label: 'Activas' },
        { value: 'inactivos', label: 'Inactivas' }
    ];

    form = this.fb.nonNullable.group({
        codigo: ['', Validators.required],
        nombre: ['', Validators.required],
        activo: [true]
    });

    ngOnInit(): void {
        this.cargarSeries();
    }

    onGlobalFilter(table: Table, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    cargarSeries(): void {
        this.loading.set(true);

        const activo = this.filtroActivo === 'todos' ? undefined : this.filtroActivo === 'activos';
        
        this.catalogoService.getSeries({ activo }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                this.series.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las series.' });
            }
        });
    }

    abrirNuevo(): void {
        this.editId.set('');
        this.form.reset({ codigo: '', nombre: '', activo: true });
        this.form.markAsUntouched();
        this.dialogVisible = true;
    }

    editarSerie(s: Serie): void {
        this.editId.set(s.id);
        this.form.reset({
            codigo: s.codigo,
            nombre: s.nombre,
            activo: s.activo
        });
        this.dialogVisible = true;
    }

    eliminarSerie(s: Serie): void {
        this.confirmationService.confirm({
            message: `¿Estás seguro de desactivar la serie <b>${s.nombre}</b>?`,
            header: 'Confirmar Acción',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, Desactivar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const payload = { ...s, activo: false };

                this.catalogoService.actualizarSerie(s.id, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargarSeries();
                        this.messageService.add({ severity: 'success', summary: 'Inactivada', detail: 'Serie desactivada.' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Fallo', detail: 'Error al desactivar.' })
                });
            }
        });
    }

    guardar(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();

            return;
        }

        this.saving.set(true);
        const raw = this.form.getRawValue();
        const payload: CrearSerieRequest = {
            codigo: raw.codigo,
            nombre: raw.nombre,
            activo: raw.activo
        };

        const req$ = this.editId() 
            ? this.catalogoService.actualizarSerie(this.editId(), payload)
            : this.catalogoService.crearSerie(payload);

        req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.saving.set(false);
                this.dialogVisible = false;
                this.cargarSeries();
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Serie registrada correctamente.' });
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se procesó la solicitud de la serie.' });
            }
        });
    }
}
