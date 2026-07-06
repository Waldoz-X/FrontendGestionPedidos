import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AppConfig {
    apiBase?: string;
    catalogosBase?: string;
    catalogoBase?: string;
    defaultTipoUsuario?: string;
    cloudinaryCloudName?: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
    private config: AppConfig = {};

    private readonly http = inject(HttpClient);

    async load(): Promise<void> {
        try {
            const cfg = await firstValueFrom(this.http.get<AppConfig>('/assets/app-config.json'));

            this.config = cfg || {};
        } catch {
            // If loading fails, keep defaults (fallbacks applied in getters)
            this.config = {};
        }
    }

    get(key: keyof AppConfig, fallback?: string): string | undefined {
        return (this.config[key] as string) ?? fallback;
    }

    getApiBase(): string {
        return this.get('apiBase', '/api')!;
    }

    getCatalogosBase(): string {
        return this.get('catalogosBase', '/api/Catalogos')!;
    }

    getCatalogoBase(): string {
        return this.get('catalogoBase', '/api/catalogo')!;
    }

    getDefaultTipoUsuario(): string {
        return this.get('defaultTipoUsuario', 'Empleado')!;
    }

    getCloudinaryCloudName(): string {
        return this.get('cloudinaryCloudName', 'dvqppegcf')!;
    }
}




