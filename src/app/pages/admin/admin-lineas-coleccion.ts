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
import { CrearLineaColeccionRequest, LineaColeccion } from '../service/catalogo-api.types';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
    selector: 'p-admin-lineas-coleccion',
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
        SelectModule,
        InputNumberModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog [style]="{ width: '450px' }"></p-confirmDialog>

        <div class="card">
            <!-- ═══ TOOLBAR ═══ -->
            <p-toolbar class="mb-6">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Líneas de Colección</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Administración de líneas de producto pre-configuradas.</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Nueva Línea" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="abrirNuevo()" />
                    <p-button label="Recargar" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="cargarLineas()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <!-- ═══ FILTROS ═══ -->
            <div class="grid grid-cols-12 gap-4 mb-4">
                <div class="col-span-12 md:col-span-3">
                    <p-select [options]="estadoFiltroOptions" optionLabel="label" optionValue="value" [(ngModel)]="filtroActivo" [ngModelOptions]="{ standalone: true }" placeholder="Estado" class="w-full" appendTo="body"></p-select>
                </div>
                <div class="col-span-12 md:col-span-3">
                    <p-select [options]="divisionFiltroOptions" optionLabel="label" optionValue="value" [(ngModel)]="filtroDivision" [ngModelOptions]="{ standalone: true }" placeholder="División (Todas)" class="w-full" [showClear]="true" appendTo="body"></p-select>
                </div>
                <div class="col-span-12 md:col-span-4 flex items-end">
                    <p-button label="Filtrar" icon="pi pi-filter" severity="secondary" (onClick)="cargarLineas()"></p-button>
                </div>
            </div>

            <!-- ═══ TABLA LINEAS ═══ -->
            <p-table
                #dt
                [value]="lineas()"
                dataKey="id"
                [loading]="loading()"
                [paginator]="true"
                [rows]="10"
                [globalFilterFields]="['codigo', 'nombre', 'division']"
                [rowHover]="true">

                <ng-template #caption>
                    <div class="flex items-center justify-between">
                        <span></span>
                        <p-iconfield>
                            <p-inputicon class="pi pi-search"></p-inputicon>
                            <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" placeholder="Buscar..." />
                        </p-iconfield>
                    </div>
                </ng-template>

                <ng-template #header>
                    <tr>
                        <th pSortableColumn="codigo">Código <p-sortIcon field="codigo"></p-sortIcon></th>
                        <th pSortableColumn="nombre">Nombre <p-sortIcon field="nombre"></p-sortIcon></th>
                        <th pSortableColumn="division">División <p-sortIcon field="division"></p-sortIcon></th>
                        <th pSortableColumn="anio">Año <p-sortIcon field="anio"></p-sortIcon></th>
                        <th pSortableColumn="activo">Estado <p-sortIcon field="activo"></p-sortIcon></th>
                        <th style="min-width: 8rem"></th>
                    </tr>
                </ng-template>
                <ng-template #body let-linea>
                    <tr>
                        <td class="font-medium text-primary">{{ linea.codigo }}</td>
                        <td>{{ linea.nombre }}</td>
                        <td>{{ linea.division }}</td>
                        <td>{{ linea.anio === 0 ? 'General' : linea.anio }}</td>
                        <td><p-tag [value]="linea.activo ? 'Activa' : 'Inactiva'" [severity]="linea.activo ? 'success' : 'danger'"></p-tag></td>
                        <td>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editarLinea(linea)" pTooltip="Editar"></p-button>
                                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="eliminarLinea(linea)" pTooltip="Desactivar"></p-button>
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #empty>
                    <tr><td colspan="6">No hay líneas registradas con los filtros actuales.</td></tr>
                </ng-template>
            </p-table>
        </div>

        <!-- ═══ DIALOGO LINEA DE COLECCION ═══ -->
        <p-dialog [(visible)]="dialogVisible" [style]="{ width: '500px' }" [header]="editId() ? 'Editar Línea' : 'Crear Línea'" [modal]="true">
            <ng-template #content>
                <form [formGroup]="form" class="flex flex-col gap-6 mt-2 pb-2">
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12">
                            <label for="codigo" class="block font-bold mb-2">Código Interno</label>
                            <input pInputText id="codigo" formControlName="codigo" fluid autofocus />
                        </div>
                        <div class="col-span-12">
                            <label for="nombre" class="block font-bold mb-2">Nombre Comercial</label>
                            <input pInputText id="nombre" formControlName="nombre" fluid />
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="division" class="block font-bold mb-2">División Estratégica</label>
                            <p-select [options]="divisionFiltroOptions" id="division" formControlName="division" class="w-full" optionLabel="label" optionValue="value" fluid appendTo="body"></p-select>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <label for="anio" class="block font-bold mb-2">Año</label>
                            
                            <p-inputNumber inputId="anio" formControlName="anio" fluid [useGrouping]="false" [min]="0" [max]="2100" placeholder="0 para general"></p-inputNumber>
                            
                            <small class="text-surface-500">0 = General. Máx: 2100</small>
                        </div>
                        <div class="col-span-12 flex items-center gap-2 mt-2">
                            <p-checkbox inputId="activo" formControlName="activo" [binary]="true"></p-checkbox>
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
export class AdminLineasColeccionComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly catalogoService = inject(CatalogoService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    lineas = signal<LineaColeccion[]>([]);

    loading = signal(false);
    saving = signal(false);

    dialogVisible = false;
    editId = signal('');

    filtroActivo: string = 'activos';
    filtroDivision: string | null = null;

    estadoFiltroOptions = [
        { value: 'todos', label: 'Todos' },
        { value: 'activos', label: 'Activas' },
        { value: 'inactivos', label: 'Inactivas' }
    ];

    divisionFiltroOptions = [
        { label: 'Guante', value: 'Guante' },
        { label: 'Fitness', value: 'Fitness' },
        { label: 'Mochila', value: 'Mochila' },
        { label: 'Cono', value: 'Cono' },
        { label: 'Espinillera', value: 'Espinillera' },
        { label: 'Accesorio', value: 'Accesorio' },
        { label: 'Textil', value: 'Textil' }
    ];

    form = this.fb.nonNullable.group({
        codigo: ['', Validators.required],
        nombre: ['', Validators.required],
        division: ['Guante', Validators.required],
        anio: [0, [Validators.required, Validators.min(0), Validators.max(2100)]],
        activo: [true]
    });

    ngOnInit(): void {
        this.cargarLineas();
    }

    onGlobalFilter(table: Table, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    cargarLineas(): void {
        this.loading.set(true);

        const activo = this.filtroActivo === 'todos' ? undefined : this.filtroActivo === 'activos';
        const division = this.filtroDivision || undefined;

        this.catalogoService.getLineasColeccion({ activo, division }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                this.lineas.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las líneas.' });
            }
        });
    }

    abrirNuevo(): void {
        this.editId.set('');
        this.form.reset({ codigo: '', nombre: '', division: 'Guante', anio: 0, activo: true });
        this.form.markAsUntouched();
        this.dialogVisible = true;
    }

    editarLinea(l: LineaColeccion): void {
        this.editId.set(l.id);
        this.form.reset({
            codigo: l.codigo,
            nombre: l.nombre,
            division: l.division,
            anio: l.anio,
            activo: l.activo
        });
        this.dialogVisible = true;
    }

    eliminarLinea(l: LineaColeccion): void {
        this.confirmationService.confirm({
            message: `¿Estás seguro de desactivar la línea <b>${l.nombre}</b>?`,
            header: 'Confirmar Acción',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, Desactivar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const payload = { ...l, activo: false };

                this.catalogoService.actualizarLineaColeccion(l.id, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargarLineas();
                        this.messageService.add({ severity: 'success', summary: 'Inactivada', detail: 'Línea de colección desactivada.' });
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
        const payload: CrearLineaColeccionRequest = {
            codigo: raw.codigo,
            nombre: raw.nombre,
            division: raw.division,
            anio: raw.anio,
            activo: raw.activo
        };

        const req$ = this.editId()
            ? this.catalogoService.actualizarLineaColeccion(this.editId(), payload)
            : this.catalogoService.crearLineaColeccion(payload);

        req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.saving.set(false);
                this.dialogVisible = false;
                this.cargarLineas();
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Línea registrada correctamente.' });
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se procesó la solicitud.' });
            }
        });
    }
}
