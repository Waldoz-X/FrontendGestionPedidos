# Plan: Módulo Gestor de Imágenes Cloudinary

## Descripción General
Crear un módulo completo para gestionar imágenes en Cloudinary con explorador de carpetas, subida de archivos y copia de URLs. Incluye servicio API de Cloudinary, tipos TypeScript, y una interfaz UI con PrimeNG para exploración de directorios y gestión de archivos.

## Contexto del Proyecto
- **Framework**: Angular 21 (standalone components)
- **UI**: PrimeNG 21.0.2 con Tailwind CSS
- **Backend**: API REST (localhost:7140, proxy en /api)
- **Estructura**: Modular por páginas en `src/app/pages/`
- **Auth**: Token JWT con interceptor
- **Configuración**: Dinámico desde `app-config.json` y `.env`

## Credenciales Cloudinary
```
CLOUDINARY_CLOUD_NAME: dvqppegcf
CLOUDINARY_APIKEY: 599196524587627
CLOUDINARY_APISECRET: EDM9qblt9a7mRyV7sae1wWVDCUw
CLOUDINARY_URL: cloudinary://<CLOUDINARY_APIKEY>:<CLOUDINARY_APISECRET>@dvqppegcf
```

## Plan de Implementación

### Paso 1: Extender AppConfigService

**Archivo**: `src/app/config/app-config.service.ts`
**Cambios**:
- Agregar propiedades `cloudinaryCloudName`, `cloudinaryApiUrl` a interfaz `AppConfig`
- Agregar getters `getCloudinaryCloudName()`, `getCloudinaryApiUrl()`
- El apiKey y apiSecret no se exponen en frontend (se protegen en backend)

**Archivo**: `src/assets/app-config.json`
**Cambios**:
- Agregar `"cloudinaryCloudName": "dvqppegcf"`
- Agregar `"cloudinaryApiUrl": "/api/cloudinary"` (endpoint proxy del backend)

### Paso 2: Crear Tipos TypeScript para Cloudinary

**Archivo**: `src/app/pages/service/cloudinary-api.types.ts`
**Contenido**:
```typescript
// Respuesta de listar recursos/carpetas
export interface CloudinaryResource {
  public_id: string;
  resource_type: 'image' | 'video' | 'raw';
  type: 'upload' | 'private' | 'authenticated';
  created_at: string;
  bytes: number;
  width?: number;
  height?: number;
  url: string;
  secure_url: string;
  folder: string;
  tags: string[];
}

// Respuesta agregada por carpetas
export interface CloudinaryFolder {
  name: string;
  path: string;
  fileCount: number;
  lastModified?: Date;
}

// Respuesta de subida
export interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
  api_key: string;
}

// Request para listar recursos
export interface ListResourcesRequest {
  type?: string; // 'upload', 'private', 'authenticated'
  prefix?: string; // path/to/folder
  maxResults?: number;
  nextCursor?: string;
}

// Respuesta de listar recursos
export interface ListResourcesResponse {
  resources: CloudinaryResource[];
  next_cursor?: string;
  rate_limit_allowed: number;
  rate_limit_reset_at: string;
  rate_limit_remaining: number;
}

// Request para listar carpetas
export interface ListFoldersRequest {
  maxResults?: number;
  nextCursor?: string;
}

// Respuesta de listar carpetas
export interface ListFoldersResponse {
  folders: Array<{ name: string; path: string }>;
  next_cursor?: string;
}

// Respuesta simple para operaciones
export interface CloudinaryApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Paso 3: Crear Servicio de API Cloudinary

**Archivo**: `src/app/pages/service/cloudinary-api.service.ts`
**Contenido**:
- Inyectar `HttpClient` y `AppConfigService`
- Método `listFolders()` - obtener lista de carpetas
- Método `listResources(prefix)` - listar archivos en carpeta
- Método `uploadImage(file, folder, tags)` - subir imagen
- Método `deleteResource(publicId)` - eliminar archivo
- Método `getFolderStats(folder)` - obtener estadísticas de carpeta
- Manejo centralizado de errores con MessageService

```typescript
@Injectable({ providedIn: 'root' })
export class CloudinaryApiService {
  private apiUrl: string;

  constructor(
    private http: HttpClient,
    private appConfig: AppConfigService
  ) {
    this.apiUrl = `${this.appConfig.getApiBase()}/Cloudinary`;
  }

  listFolders(): Observable<CloudinaryFolder[]> {
    return this.http.get<CloudinaryFolder[]>(`${this.apiUrl}/folders`);
  }

  listResources(prefix?: string): Observable<CloudinaryResource[]> {
    const params = prefix ? { prefix } : {};
    return this.http.get<CloudinaryResource[]>(`${this.apiUrl}/resources`, { params });
  }

  uploadImage(file: File, folder: string, tags?: string[]): Observable<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    if (tags && tags.length > 0) {
      formData.append('tags', tags.join(','));
    }
    return this.http.post<CloudinaryUploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  deleteResource(publicId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/resources/${encodeURIComponent(publicId)}`);
  }

  getFolderStats(folder: string): Observable<{ folder: string; fileCount: number; totalSize: number }> {
    return this.http.get<any>(`${this.apiUrl}/folders/${encodeURIComponent(folder)}/stats`);
  }
}
```

### Paso 4: Registrar Ruta en pages.routes.ts

**Archivo**: `src/app/pages/pages.routes.ts`
**Cambios**:
- Importar componente `GestorCloudinary`
- Agregar ruta: `{ path: 'gestor-cloudinary', component: GestorCloudinary }`

### Paso 5: Crear Componentes UI

#### 5.1 Componente Principal: `gestor-cloudinary.ts`
**Archivo**: `src/app/pages/gestor-cloudinary/gestor-cloudinary.ts`
- Componente padre que orquesta explorador, uploader y visor
- Layout con tabs o split-view
- Estados de carga, errores y éxito
- Coordina selección de carpetas entre subcomponentes

#### 5.2 Componente Explorador de Carpetas: `cloudinary-folder-explorer.ts`
**Archivo**: `src/app/pages/gestor-cloudinary/cloudinary-folder-explorer.ts`
- TreeTable de PrimeNG mostrando estructura de carpetas
- Evento `onFolderSelect` para notificar carpeta seleccionada al padre
- Ícono de carpeta, cuenta de archivos, tamaño
- Emitir `@Output() folderSelected: EventEmitter<CloudinaryFolder>`

#### 5.3 Componente Uploader: `cloudinary-uploader.ts`
**Archivo**: `src/app/pages/gestor-cloudinary/cloudinary-uploader.ts`
- FileUpload de PrimeNG (drag & drop)
- Input `@Input() selectedFolder` para saber dónde subir
- Validar solo imágenes (.jpg, .png, .gif, .webp)
- Mostrar progreso de carga
- Success/error toast con Toastr
- Emitir evento `uploadComplete` después de subida exitosa

#### 5.4 Componente Visor de Archivos: `cloudinary-file-viewer.ts`
**Archivo**: `src/app/pages/gestor-cloudinary/cloudinary-file-viewer.ts`
- DataTable con columnas: Thumbnail (preview), Nombre, Tamaño, Fecha, Acciones
- Input `@Input() selectedFolder` para cargar archivos dinámicamente
- Tabla con scroll horizontal en mobile
- Acciones por fila:
  - Botón "Copiar URL" → copiar a clipboard y mostrar toast
  - Botón "Ver" → abrir en modal/lightbox
  - Botón "Descargar"
  - Botón "Eliminar" → confirmar y ejecutar
- Paginación y búsqueda

### Paso 6: Estructura de Carpetas

```
src/app/pages/gestor-cloudinary/
  ├── gestor-cloudinary.ts           # Componente principal
  ├── cloudinary-folder-explorer.ts  # Explorador de carpetas (TreeTable)
  ├── cloudinary-uploader.ts         # Uploader con drag & drop
  ├── cloudinary-file-viewer.ts      # Visor de archivos (DataTable)
  └── gestor-cloudinary.styles.scss  # Estilos compartidos

src/app/pages/service/
  ├── cloudinary-api.service.ts      # Servicio API
  └── cloudinary-api.types.ts        # Tipos TypeScript
```

## Backend Integration (Expected)

Tu backend debe exponer estos endpoints bajo `/api/Cloudinary`:

### Endpoints Requeridos

1. **GET** `/api/Cloudinary/folders`
   - Retorna lista de carpetas top-level
   - Response: `CloudinaryFolder[]`

2. **GET** `/api/Cloudinary/resources?prefix={folder}`
   - Retorna archivos en carpeta especificada
   - Response: `CloudinaryResource[]`

3. **POST** `/api/Cloudinary/upload`
   - Recibe multipart form-data (file, folder, tags)
   - Sube a Cloudinary usando ServerSDK
   - Response: `CloudinaryUploadResponse`

4. **DELETE** `/api/Cloudinary/resources/{publicId}`
   - Elimina recurso de Cloudinary
   - Response: `{ success: boolean }`

5. **GET** `/api/Cloudinary/folders/{folder}/stats`
   - Estadísticas de carpeta
   - Response: `{ folder: string, fileCount: number, totalSize: number }`

## Consideraciones de Seguridad

1. **No exponer credenciales en frontend** — Todas las llamadas a Cloudinary deben pasar por backend con token JWT autenticado
2. **Validación de roles** — Agregar guards/checks para que solo Admin/Comercial puedan subir/eliminar
3. **Límite de tamaño de archivo** — Validar en frontend (máx 10MB) y en backend
4. **Escaneo de virus** — Considerar agregar en backend antes de almacenar
5. **Logging de auditoría** — Registrar quién subió/eliminó qué y cuándo

## Flujo de Usuario

1. Usuario accede a `/pages/gestor-cloudinary`
2. Se cargan carpetas disponibles en explorador (left panel)
3. Usuario selecciona una carpeta → se cargan archivos en visor (right panel)
4. Usuario puede:
   - **Subir**: Arrastra imagen a uploader → se sube a carpeta seleccionada
   - **Copiar URL**: Clic en archivo → copia URL segura a clipboard
   - **Descargar**: Clic en descargar
   - **Eliminar**: Clic en eliminar → confirma → borra de Cloudinary
5. Búsqueda y filtrado en visor de archivos
6. Notificaciones toast para feedback de acciones

## Dependencias Existentes

- ✅ `HttpClient` - para HTTP requests
- ✅ `PrimeNG` (FileUpload, DataTable, TreeTable, Toast, Button, Dialog)
- ✅ `RxJS` - manejo de observables
- ✅ `CommonModule` - directivas comunes
- ✅ `MessageService` - para toasts
- ✅ `AppConfigService` - acceso a configuración

## Próximos Pasos Después de Plan

1. Crear tipos (`cloudinary-api.types.ts`)
2. Extender `app-config.service.ts` con Cloudinary config
3. Crear `cloudinary-api.service.ts` con lógica de API
4. Crear componente principal `gestor-cloudinary.ts`
5. Crear subcomponentes (explorer, uploader, viewer)
6. Registrar ruta en `pages.routes.ts`
7. Agregar al menú de navegación (si aplica)
8. Implementar backend endpoints en `.NET` con Cloudinary SDK

## Notas

- Usar `standalone: true` en todos los componentes (ya es el estándar del proyecto)
- Utilizar signals y change detection zoneless (como en `app.config.ts`)
- Seguir estructura modular y reutilizable
- Estilos con Tailwind CSS y scss variables del proyecto
- Compatibilidad con tema dark mode (ya configurado en PrimeNG)

