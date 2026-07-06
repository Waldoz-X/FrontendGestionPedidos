import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'p-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <p-menuitem [item]="item" [root]="true"></p-menuitem>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `,
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Administración',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
                    { label: 'Clientes', icon: 'pi pi-fw pi-building', routerLink: ['/clientes'] },
                    { label: 'Empleados', icon: 'pi pi-fw pi-users', routerLink: ['/empleados'] },
                    { label: 'Usuarios', icon: 'pi pi-fw pi-user-edit', routerLink: ['/admin/usuarios'] },
                    { label: 'Asignaciones', icon: 'pi pi-fw pi-link', routerLink: ['/asignaciones'] },
                    { label: 'Catálogos', icon: 'pi pi-fw pi-folder', routerLink: ['/admin/catalogos'] }
                ]
            },
            {
                label: 'Multimedia',
                items: [
                    { label: 'Gestor Cloudinary', icon: 'pi pi-fw pi-cloud', routerLink: ['/pages/gestor-cloudinary'] }
                ]
            },
            {
                label: 'Productos',
                items: [
                    { label: 'Guantes', icon: 'pi pi-fw pi-box', routerLink: ['/productos/guantes'] },
                    { label: 'Visor de Guantes', icon: 'pi pi-fw pi-images', routerLink: ['/productos/guantes-visor'] },
                    { label: 'Textiles', icon: 'pi pi-fw pi-star', routerLink: ['/productos/textil'] },
                    { label: 'Visor de Textiles', icon: 'pi pi-fw pi-images', routerLink: ['/productos/textil-visor'] },
                    { label: 'Mochilas', icon: 'pi pi-fw pi-shopping-bag', routerLink: ['/productos/mochilas'] },
                    { label: 'Visor de Mochilas', icon: 'pi pi-fw pi-images', routerLink: ['/productos/mochilas-visor'] },
                    { label: 'Fitness', icon: 'pi pi-fw pi-heart', routerLink: ['/productos/fitness'] },
                    { label: 'Visor de Fitness', icon: 'pi pi-fw pi-images', routerLink: ['/productos/fitness-visor'] },
                    { label: 'Espinilleras', icon: 'pi pi-fw pi-shield', routerLink: ['/productos/espinilleras'] },
                    { label: 'Visor de Espinilleras', icon: 'pi pi-fw pi-images', routerLink: ['/productos/espinilleras-visor'] },
                    { label: 'Accesorios', icon: 'pi pi-fw pi-paperclip', routerLink: ['/productos/accesorios'] },
                    { label: 'Visor de Accesorios', icon: 'pi pi-fw pi-images', routerLink: ['/productos/accesorios-visor'] },
                    { label: 'Conos', icon: 'pi pi-fw pi-exclamation-triangle', routerLink: ['/productos/conos'] },
                    { label: 'Visor de Conos', icon: 'pi pi-fw pi-images', routerLink: ['/productos/conos-visor'] }
                ]
            },
            {
                label: 'Comercial',
                items: [
                    { label: 'Precios', icon: 'pi pi-fw pi-dollar', routerLink: ['/comercial/precios'] },
                    { label: 'Políticas', icon: 'pi pi-fw pi-briefcase', routerLink: ['/comercial/politicas'] },
                    { label: 'Visibilidad', icon: 'pi pi-fw pi-eye', routerLink: ['/comercial/visibilidad'] }
                ]
            },
            {
                label: 'UI Components',
                items: [
                    { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', routerLink: ['/uikit/formlayout'] },
                    { label: 'Input', icon: 'pi pi-fw pi-check-square', routerLink: ['/uikit/input'] },
                    { label: 'Button', icon: 'pi pi-fw pi-mobile', class: 'rotated-icon', routerLink: ['/uikit/button'] },
                    { label: 'Table', icon: 'pi pi-fw pi-table', routerLink: ['/uikit/table'] },
                    { label: 'List', icon: 'pi pi-fw pi-list', routerLink: ['/uikit/list'] },
                    { label: 'Tree', icon: 'pi pi-fw pi-share-alt', routerLink: ['/uikit/tree'] },
                    { label: 'Panel', icon: 'pi pi-fw pi-tablet', routerLink: ['/uikit/panel'] },
                    { label: 'Overlay', icon: 'pi pi-fw pi-clone', routerLink: ['/uikit/overlay'] },
                    { label: 'Media', icon: 'pi pi-fw pi-image', routerLink: ['/uikit/media'] },
                    { label: 'Menu', icon: 'pi pi-fw pi-bars', routerLink: ['/uikit/menu'] },
                    { label: 'Message', icon: 'pi pi-fw pi-comment', routerLink: ['/uikit/message'] },
                    { label: 'File', icon: 'pi pi-fw pi-file', routerLink: ['/uikit/file'] },
                    { label: 'Chart', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/uikit/charts'] },
                    { label: 'Timeline', icon: 'pi pi-fw pi-calendar', routerLink: ['/uikit/timeline'] },
                    { label: 'Misc', icon: 'pi pi-fw pi-circle', routerLink: ['/uikit/misc'] }
                ]
            }
        ];
    }
}
