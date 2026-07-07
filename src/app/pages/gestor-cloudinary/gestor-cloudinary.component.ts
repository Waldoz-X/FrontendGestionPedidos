import { Component, OnInit, inject, signal } from '@angular/core';

import { TabsModule } from 'primeng/tabs';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CloudinaryFolder } from '../service/cloudinary-api.types';
import { CloudinaryFolderExplorerComponent } from './cloudinary-folder-explorer.component';
import { CloudinaryUploaderComponent } from './cloudinary-uploader.component';
import { CloudinaryFileViewerComponent } from './cloudinary-file-viewer.component';

/**
 * Componente principal para gestionar imágenes en Cloudinary
 * Orquesta: explorador de carpetas, uploader y visor de archivos
 */
@Component({
  selector: 'p-gestor-cloudinary',
  standalone: true,
  imports: [
    TabsModule,
    ToastModule,
    ButtonModule,
    CloudinaryFolderExplorerComponent,
    CloudinaryUploaderComponent,
    CloudinaryFileViewerComponent
],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="p-4">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
          <i class="pi pi-cloud mr-2"></i>Gestor de Imágenes Cloudinary
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Gestiona, sube y organiza tus imágenes en la nube
        </p>
      </div>

      <div class="grid grid-cols-1 lg:col-span-4 gap-4 mb-6">
        @if (selectedFolder) {
          <div class="col-span-1 lg:col-span-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-700 dark:text-gray-300">Carpeta Seleccionada:</p>
                <p class="text-lg font-semibold text-blue-600 dark:text-blue-400">{{ selectedFolder.path }}</p>
              </div>
              <p-button
                label="Limpiar"
                icon="pi pi-times"
                severity="secondary"
                [text]="true"
                (onClick)="selectedFolder = null"
              ></p-button>
            </div>
          </div>
        }
      </div>

      <p-tabs [value]="activeTab()">
        <p-tablist>
          <p-tab value="0" (click)="activeTab.set('0')"><i class="pi pi-folder mr-2"></i>Explorador de Carpetas</p-tab>
          <p-tab value="1" (click)="activeTab.set('1')"><i class="pi pi-upload mr-2"></i>Subir Imágenes</p-tab>
          <p-tab value="2" (click)="activeTab.set('2')"><i class="pi pi-images mr-2"></i>Ver Archivos</p-tab>
        </p-tablist>
        
        <p-tabpanels>
          <!-- Tab 0: Explorador de Carpetas -->
          <p-tabpanel value="0">
            <p-cloudinary-folder-explorer
              (folderSelected)="onFolderSelected($event)"
            />
          </p-tabpanel>
  
          <!-- Tab 1: Subir Imágenes -->
          <p-tabpanel value="1">
            <p-cloudinary-uploader
              [selectedFolder]="selectedFolder"
              (uploadComplete)="onUploadComplete($event)"
            />
          </p-tabpanel>
  
          <!-- Tab 2: Ver Archivos -->
          <p-tabpanel value="2">
            <p-cloudinary-file-viewer
              [selectedFolder]="selectedFolder"
              (fileDeleted)="onFileDeleted($event)"
            />
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>
  `
})
export class GestorCloudinaryComponent implements OnInit {
  private messageService = inject(MessageService);

  selectedFolder: CloudinaryFolder | null = null;
  activeTab = signal<string>('0');

  ngOnInit(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Bienvenido',
      detail: 'Selecciona una carpeta para ver sus imágenes',
      life: 4000
    });
  }

  onFolderSelected(folder: CloudinaryFolder): void {
    this.selectedFolder = folder;
    this.activeTab.set('2'); // Redirección automática a la pestaña "Ver Archivos"
    this.messageService.add({
      severity: 'success',
      summary: 'Carpeta seleccionada',
      detail: `Carpeta: ${folder.path}`,
      life: 3000
    });
  }

  onUploadComplete(filename: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Carga exitosa',
      detail: `${filename} fue subido correctamente`,
      life: 3000
    });
  }

  onFileDeleted(filename: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Archivo eliminado',
      detail: `${filename} fue eliminado correctamente`,
      life: 3000
    });
  }
}


