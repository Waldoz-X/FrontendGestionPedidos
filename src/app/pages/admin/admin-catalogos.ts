import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { CatalogosApiService, Catalogo, CatalogoElemento, CrearCatalogoElementoRequest, ActualizarCatalogoElementoRequest, CrearCatalogoRequest, ActualizarCatalogoRequest } from '../service/catalogos-api.service';

@Component({
    selector: 'p-admin-catalogos',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule, SelectModule, DialogModule, ToastModule, ToolbarModule, ConfirmDialogModule, CheckboxModule, TagModule],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast />
        <p-confirmDialog />

        <div class="card">
            <p-toolbar class="mb-4">
                <ng-template #start>
                    <div>
                        <div class="font-semibold text-xl">Catálogos</div>
                        <p class="m-0 text-surface-500 dark:text-surface-400">Administración de catálogos y sus elementos</p>
                    </div>
                </ng-template>
                <ng-template #end>
                    <p-button label="Recargar" icon="pi pi-refresh" [outlined]="true" (onClick)="recargar()" [loading]="loading()" />
                </ng-template>
            </p-toolbar>

            <div class="mb-4 p-4 border rounded-lg bg-surface-50 dark:bg-surface-900 border-surface-200 dark:border-surface-700">
                <div class="flex items-center gap-4 flex-wrap">
                    <label class="font-semibold">Catálogo Padre:</label>
                    <p-select [options]="catalogos()" [(ngModel)]="selectedCatalogo" optionLabel="nbCatalogo" placeholder="Seleccione un catálogo..." (onChange)="cargarElementos($event.value?.clCatalogo)" class="w-64"></p-select>
                    
                    <p-button icon="pi pi-plus" label="Nuevo" [outlined]="true" severity="success" (onClick)="abrirNuevoCatalogo()" />
                    <p-button icon="pi pi-pencil" [outlined]="true" severity="info" [disabled]="!selectedCatalogo" (onClick)="editarCatalogo()" />
                    <p-button icon="pi pi-trash" [outlined]="true" severity="danger" [disabled]="!selectedCatalogo" (onClick)="eliminarCatalogoDialog()" />
                </div>
            </div>

            <div class="flex justify-between items-center mb-4 mt-8">
                <h3 class="m-0 text-lg font-semibold">Elementos de {{ selectedCatalogo?.nbCatalogo || '...' }}</h3>
                <p-button label="Nuevo Elemento" icon="pi pi-plus" (onClick)="abrirNuevoElemento()" [disabled]="!selectedCatalogo" />
            </div>

            <p-table [value]="elementos()" dataKey="idCatalogoElemento" [loading]="loading()" [paginator]="true" [rows]="10">
                <ng-template #header>
                    <tr>
                        <th>Catálogo</th>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Sub-Elemento de</th>
                        <th>Estado</th>
                        <th></th>
                    </tr>
                </ng-template>
                <ng-template #body let-el>
                    <tr>
                        <td>
                            <p-tag [value]="el.nbCatalogo || selectedCatalogo?.nbCatalogo" severity="info"></p-tag>
                        </td>
                        <td>{{ el.clCatalogoElemento }}</td>
                        <td>{{ el.nbCatalogoElemento }}</td>
                        <td>{{ el.dsCatalogoElemento }}</td>
                        <td>{{ el.nbCatalogoElementoPadre || '-' }}</td>
                        <td>
                            <p-tag [value]="el.clEstatusCatalogoElemento || 'ACTIVO'" [severity]="el.clEstatusCatalogoElemento === 'INACTIVO' ? 'danger' : 'success'"></p-tag>
                        </td>
                        <td>
                            <div class="flex gap-2">
                                <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" (onClick)="editarElemento(el)" />
                                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="eliminarElementoDialog(el)" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
                <ng-template #empty>
                    <tr><td colspan="7">No hay elementos seleccionados o creados.</td></tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Modal Catálogo -->
        <p-dialog [(visible)]="dialogCatalogoVisible" [modal]="true" [style]="{ width: '520px' }" [header]="editModeCatalogo ? 'Editar Catálogo' : 'Nuevo Catálogo'">
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="block font-bold mb-2">Código</label>
                        <input pInputText [(ngModel)]="formCatalogo.clCatalogo" [disabled]="editModeCatalogo" />
                    </div>
                    <div>
                        <label class="block font-bold mb-2">Nombre</label>
                        <input pInputText [(ngModel)]="formCatalogo.nbCatalogo" />
                    </div>
                    <div>
                        <label class="block font-bold mb-2">Descripción</label>
                        <input pInputText [(ngModel)]="formCatalogo.dsCatalogo" />
                    </div>
                    <div>
                        <label class="block font-bold mb-2">Catálogo Padre (Opcional)</label>
                        <p-select [options]="catalogos()" [(ngModel)]="formCatalogo.idCatalogoPadre" optionLabel="nbCatalogo" optionValue="id" placeholder="Ninguno" [showClear]="true" appendTo="body" class="w-full"></p-select>
                    </div>

                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="dialogCatalogoVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarCatalogo()" [loading]="saving()" />
            </ng-template>
        </p-dialog>

        <!-- Modal Elemento -->
        <p-dialog [(visible)]="dialogElementoVisible" [modal]="true" [style]="{ width: '700px' }" [header]="editModeElemento ? 'Editar Elemento' : 'Nuevo Elemento'">
            <ng-template #content>
                <div class="grid grid-cols-12 gap-4 mt-2">
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-bold mb-2">Código</label>
                        <input pInputText [(ngModel)]="formElemento.clCatalogoElemento" [disabled]="editModeElemento" class="w-full" />
                    </div>
                    <div class="col-span-12 md:col-span-6">
                        <label class="block font-bold mb-2">Nombre</label>
                        <input pInputText [(ngModel)]="formElemento.nbCatalogoElemento" class="w-full" />
                    </div>
                    <div class="col-span-12">
                        <label class="block font-bold mb-2">Descripción</label>
                        <input pInputText [(ngModel)]="formElemento.dsCatalogoElemento" class="w-full" />
                    </div>
                </div>
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="dialogElementoVisible = false" />
                <p-button label="Guardar" icon="pi pi-check" (onClick)="guardarElemento()" [loading]="saving()" />
            </ng-template>
        </p-dialog>
    `
})
export class AdminCatalogosComponent implements OnInit {
    private readonly service = inject(CatalogosApiService);
    private readonly message = inject(MessageService);
    private readonly confirmation = inject(ConfirmationService);
    private readonly destroyRef = inject(DestroyRef);

    catalogos = signal<Catalogo[]>([]);
    elementos = signal<CatalogoElemento[]>([]);
    loading = signal(false);
    saving = signal(false);

    selectedCatalogo: Catalogo | null = null;

    // Estado Catalogo
    dialogCatalogoVisible = false;
    editModeCatalogo = false;
    formCatalogo: any = { clCatalogo: '', nbCatalogo: '', dsCatalogo: '', idCatalogoPadre: null, clEstatusCatalogo: 'ACTIVO' };

    // Estado Elemento
    dialogElementoVisible = false;
    editModeElemento = false;
    formElemento: any = { clCatalogoElemento: '', nbCatalogoElemento: '', dsCatalogoElemento: '', idCatalogoElementoPadre: null, clEstatusCatalogoElemento: 'ACTIVO' };

    ngOnInit(): void {
        this.cargarCatalogos();
    }

    cargarCatalogos(): void {
        this.loading.set(true);
        this.service.getCatalogos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                this.catalogos.set(data || []);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los catálogos.' });
            }
        });
    }

    cargarElementos(cl: string | undefined): void {
        if (!cl) {
            this.elementos.set([]);
            return;
        }
        this.loading.set(true);
        this.service.getElementos(cl).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => {
                this.elementos.set(data || []);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los elementos.' });
            }
        });
    }

    // --- CRUD CATÁLOGOS ---
    abrirNuevoCatalogo(): void {
        this.editModeCatalogo = false;
        this.formCatalogo = { clCatalogo: '', nbCatalogo: '', dsCatalogo: '', idCatalogoPadre: null, clEstatusCatalogo: 'ACTIVO' };
        this.dialogCatalogoVisible = true;
    }

    editarCatalogo(): void {
        if (!this.selectedCatalogo) return;
        this.editModeCatalogo = true;
        this.formCatalogo = { ...this.selectedCatalogo };
        this.dialogCatalogoVisible = true;
    }

    guardarCatalogo(): void {
        this.saving.set(true);

        if (this.editModeCatalogo) {
            const payload: ActualizarCatalogoRequest = {
                nbCatalogo: this.formCatalogo.nbCatalogo,
                dsCatalogo: this.formCatalogo.dsCatalogo,
                idCatalogoPadre: this.formCatalogo.idCatalogoPadre,
                clEstatusCatalogo: this.formCatalogo.clEstatusCatalogo
            };

            this.service.actualizarCatalogo(this.formCatalogo.idCatalogo, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                next: (res) => {
                    this.saving.set(false);
                    this.dialogCatalogoVisible = false;
                    this.selectedCatalogo = res;
                    this.cargarCatalogos();
                    this.message.add({ severity: 'success', summary: 'Actualizado', detail: 'Catálogo actualizado.' });
                },
                error: () => {
                    this.saving.set(false);
                    this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' });
                }
            });
        } else {
            const payload: CrearCatalogoRequest = {
                clCatalogo: this.formCatalogo.clCatalogo,
                nbCatalogo: this.formCatalogo.nbCatalogo,
                dsCatalogo: this.formCatalogo.dsCatalogo,
                idCatalogoPadre: this.formCatalogo.idCatalogoPadre
            };

            this.service.crearCatalogo(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                next: (res) => {
                    this.saving.set(false);
                    this.dialogCatalogoVisible = false;
                    this.selectedCatalogo = res;
                    this.cargarCatalogos();
                    this.cargarElementos(res.clCatalogo);
                    this.message.add({ severity: 'success', summary: 'Creado', detail: 'Catálogo creado.' });
                },
                error: () => {
                    this.saving.set(false);
                    this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear.' });
                }
            });
        }
    }

    eliminarCatalogoDialog(): void {
        if (!this.selectedCatalogo) return;
        this.confirmation.confirm({
            message: `¿Eliminar catálogo ${this.selectedCatalogo.nbCatalogo}?`,
            accept: () => {
                this.service.eliminarCatalogo(this.selectedCatalogo!.idCatalogo!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.selectedCatalogo = null;
                        this.elementos.set([]);
                        this.cargarCatalogos();
                        this.message.add({ severity: 'success', summary: 'Eliminado', detail: 'Catálogo eliminado.' });
                    },
                    error: () => this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el catálogo.' })
                });
            }
        });
    }

    // --- CRUD ELEMENTOS ---
    abrirNuevoElemento(): void {
        if (!this.selectedCatalogo) return;
        this.editModeElemento = false;
        this.formElemento = { clCatalogoElemento: '', nbCatalogoElemento: '', dsCatalogoElemento: '', idCatalogoElementoPadre: null, clEstatusCatalogoElemento: 'ACTIVO' };
        this.dialogElementoVisible = true;
    }

    editarElemento(el: CatalogoElemento): void {
        this.editModeElemento = true;
        this.formElemento = { ...el };
        this.dialogElementoVisible = true;
    }

    guardarElemento(): void {
        if (!this.selectedCatalogo) return;
        this.saving.set(true);

        if (this.editModeElemento) {
            const payload: ActualizarCatalogoElementoRequest = {
                nbCatalogoElemento: this.formElemento.nbCatalogoElemento,
                dsCatalogoElemento: this.formElemento.dsCatalogoElemento,
                idCatalogoElementoPadre: this.formElemento.idCatalogoElementoPadre,
                clEstatusCatalogoElemento: this.formElemento.clEstatusCatalogoElemento
            };

            this.service.actualizarElemento(this.formElemento.idCatalogoElemento, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                next: () => {
                    this.saving.set(false);
                    this.dialogElementoVisible = false;
                    this.cargarElementos(this.selectedCatalogo!.clCatalogo);
                    this.message.add({ severity: 'success', summary: 'Actualizado', detail: 'Elemento actualizado.' });
                },
                error: () => {
                    this.saving.set(false);
                    this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el elemento.' });
                }
            });
        } else {
            const payload: CrearCatalogoElementoRequest = {
                clCatalogoElemento: this.formElemento.clCatalogoElemento,
                nbCatalogoElemento: this.formElemento.nbCatalogoElemento,
                dsCatalogoElemento: this.formElemento.dsCatalogoElemento,
                idCatalogoElementoPadre: this.formElemento.idCatalogoElementoPadre
            };

            this.service.crearElemento(this.selectedCatalogo.clCatalogo, payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                next: () => {
                    this.saving.set(false);
                    this.dialogElementoVisible = false;
                    this.cargarElementos(this.selectedCatalogo!.clCatalogo);
                    this.message.add({ severity: 'success', summary: 'Creado', detail: 'Elemento creado.' });
                },
                error: () => {
                    this.saving.set(false);
                    this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el elemento.' });
                }
            });
        }
    }

    eliminarElementoDialog(el: CatalogoElemento): void {
        this.confirmation.confirm({
            message: `¿Eliminar elemento ${el.nbCatalogoElemento}?`,
            accept: () => {
                this.service.eliminarElemento(el.idCatalogoElemento!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
                    next: () => {
                        this.cargarElementos(this.selectedCatalogo!.clCatalogo);
                        this.message.add({ severity: 'success', summary: 'Eliminado' , detail: 'Elemento eliminado.'});
                    },
                    error: () => this.message.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' })
                });
            }
        });
    }

    recargar(): void {
        this.cargarCatalogos();
        if (this.selectedCatalogo) {
            this.cargarElementos(this.selectedCatalogo.clCatalogo);
        }
    }
}
