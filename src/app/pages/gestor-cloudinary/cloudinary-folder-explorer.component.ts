import { Component, OnInit, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CloudinaryApiService } from '../service/cloudinary-api.service';
import { CloudinaryFolder } from '../service/cloudinary-api.types';
import { ConfirmationService, MessageService } from 'primeng/api';

/**
 * Componente para explorar carpetas en Cloudinary
 * Muestra una estructura de carpetas con TreeTable
 */
@Component({
  selector: 'p-cloudinary-folder-explorer',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    SkeletonModule,
    TooltipModule,
    DialogModule,
    ConfirmDialogModule,
    InputTextModule,
    FormsModule
],
  providers: [ConfirmationService],
  template: `
    <p-confirmDialog />

    <div class="p-4">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
          <i class="pi pi-folder-open mr-2"></i>Carpetas
        </h2>
        <div class="flex gap-2">
          <p-button
            label="Nueva Carpeta"
            icon="pi pi-folder-plus"
            severity="success"
            (onClick)="mostrarCrearDialog = true"
          ></p-button>
          <p-button
            icon="pi pi-refresh"
            [rounded]="true"
            [text]="true"
            (onClick)="loadFolders()"
            [disabled]="isLoading"
            pTooltip="Recargar carpetas"
            tooltipPosition="left"
          ></p-button>
        </div>
      </div>

      <!-- Estado de carga -->
      @if (isLoading) {
        <div class="space-y-3">
          <p-skeleton height="2rem"></p-skeleton>
          <p-skeleton height="2rem"></p-skeleton>
          <p-skeleton height="2rem"></p-skeleton>
        </div>
      }

      <!-- Tabla de carpetas -->
      @if (!isLoading && folders.length > 0) {
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Carpeta
                </th>
                <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Archivos
                </th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              @for (folder of folders; track folder.path) {
                <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition">
                   <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                     <span class="flex items-center gap-2">
                       <i class="pi pi-folder text-yellow-500"></i>
                       <span class="font-medium">{{ folder.path }}</span>
                     </span>
                   </td>
                   <td class="px-4 py-3 text-center text-sm">
                     <span class="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
                       {{ folder.fileCount }} archivos
                     </span>
                   </td>
                   <td class="px-4 py-3 text-right">
                     <div class="flex gap-2 justify-end">
                       <p-button
                         icon="pi pi-arrow-right"
                         iconPos="right"
                         label="Ver"
                         (onClick)="selectFolder(folder)"
                         pTooltip="Seleccionar carpeta para ver archivos"
                         tooltipPosition="top"
                       ></p-button>
                       <p-button
                         icon="pi pi-trash"
                         severity="danger"
                         [outlined]="true"
                         (onClick)="confirmarEliminar(folder)"
                         pTooltip="Eliminar carpeta"
                         tooltipPosition="top"
                       ></p-button>
                     </div>
                   </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Estado vacío -->
      @if (!isLoading && folders.length === 0) {
        <div class="text-center py-12">
          <i class="pi pi-inbox text-gray-300 dark:text-gray-700 text-5xl mb-4"></i>
          <p class="text-gray-600 dark:text-gray-400">No hay carpetas disponibles</p>
          <p-button
            label="Recargar"
            icon="pi pi-refresh"
            [text]="true"
            class="mt-4"
            (onClick)="loadFolders()"
          ></p-button>
        </div>
      }

      <!-- Error -->
      @if (errorMessage) {
        <div class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-red-700 dark:text-red-400">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          {{ errorMessage }}
        </div>
      }
    </div>

    <!-- Dialog para crear carpeta -->
    <p-dialog
      [(visible)]="mostrarCrearDialog"
      [style]="{ width: '450px' }"
      header="Crear Nueva Carpeta"
      [modal]="true"
    >
      <ng-template #content>
        <div class="flex flex-col gap-4">
          <div>
            <label class="block font-bold mb-2">Nombre de la carpeta</label>
            <input
              type="text"
              pInputText
              [(ngModel)]="nuevaCarpetaNombre"
              placeholder="Ej: RINAT, GUANTES_ADULTO"
              class="w-full"
            />
          </div>
        </div>
      </ng-template>
      <ng-template #footer>
        <p-button
          label="Cancelar"
          icon="pi pi-times"
          [text]="true"
          (onClick)="cerrarCrearDialog()"
        ></p-button>
        <p-button
          label="Crear"
          icon="pi pi-check"
          [loading]="isCreando"
          [disabled]="!nuevaCarpetaNombre.trim()"
          (onClick)="crearCarpeta()"
        ></p-button>
      </ng-template>
    </p-dialog>
  `
})
export class CloudinaryFolderExplorerComponent implements OnInit {
  private cloudinaryApi = inject(CloudinaryApiService);
  private messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  @Output() folderSelected = new EventEmitter<CloudinaryFolder>();

  folders: CloudinaryFolder[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  mostrarCrearDialog = false;
  nuevaCarpetaNombre = '';
  isCreando = false;

  ngOnInit(): void {
    this.loadFolders();
  }

  loadFolders(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.cloudinaryApi.listFolders().subscribe({
      next: (folders) => {
        this.folders = folders;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error al cargar las carpetas. Intenta nuevamente.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.errorMessage,
          life: 4000
        });
        console.error('Error loading folders:', err);
        this.cdr.markForCheck();
      }
    });
  }

  selectFolder(folder: CloudinaryFolder): void {
    this.folderSelected.emit(folder);
  }

  cerrarCrearDialog(): void {
    this.mostrarCrearDialog = false;
    this.nuevaCarpetaNombre = '';
  }

  crearCarpeta(): void {
    const nombreLimpio = this.nuevaCarpetaNombre.trim();

    if (!nombreLimpio) return;

    this.isCreando = true;
    this.cloudinaryApi.createFolder(nombreLimpio).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Carpeta creada',
          detail: `La carpeta "${nombreLimpio}" fue creada correctamente.`,
          life: 3000
        });
        this.isCreando = false;
        this.cerrarCrearDialog();
        this.loadFolders();
      },
      error: (err) => {
        this.isCreando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear la carpeta.',
          life: 4000
        });
        console.error('Error creating folder:', err);
      }
    });
  }

  confirmarEliminar(folder: CloudinaryFolder): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar la carpeta "${folder.path}" y todos sus archivos asociados? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación de carpeta',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.eliminarCarpeta(folder);
      }
    });
  }

  eliminarCarpeta(folder: CloudinaryFolder): void {
    this.cloudinaryApi.deleteFolder(folder.path).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Carpeta eliminada',
          detail: `La carpeta "${folder.path}" fue eliminada correctamente.`,
          life: 3000
        });
        this.loadFolders();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la carpeta. Verifique si está vacía.',
          life: 4000
        });
        console.error('Error deleting folder:', err);
      }
    });
  }
}


