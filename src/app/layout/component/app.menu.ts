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
                label: 'Home',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
                    { label: 'Asignaciones', icon: 'pi pi-fw pi-link', routerLink: ['/asignaciones'] },
                    {
                        label: 'Catalogo',
                        icon: 'pi pi-fw pi-box',
                        path: '/catalogo',
                        items: [
                            { label: 'Productos', icon: 'pi pi-fw pi-tag', routerLink: ['/catalogo/productos'] },
                            { label: 'Variantes', icon: 'pi pi-fw pi-palette', routerLink: ['/catalogo/variantes'] },
                            { label: 'SKUs', icon: 'pi pi-fw pi-barcode', routerLink: ['/catalogo/skus'] },
                            { label: 'Precios', icon: 'pi pi-fw pi-dollar', routerLink: ['/catalogo/precios'] },
                            { label: 'Gamas', icon: 'pi pi-fw pi-layers', routerLink: ['/catalogo/gamas'] }
                        ]
                    },
                    { label: 'Clientes', icon: 'pi pi-fw pi-building', routerLink: ['/clientes'] },
                    { label: 'Empleados', icon: 'pi pi-fw pi-users', routerLink: ['/empleados'] },
                    {
                        label: 'Admin',
                        icon: 'pi pi-fw pi-shield',
                        path: '/admin',
                        items: [
                            { label: 'Usuarios clientes', icon: 'pi pi-fw pi-user-edit', routerLink: ['/admin/clientes-usuarios'] },
                            { label: 'Usuarios empleados', icon: 'pi pi-fw pi-key', routerLink: ['/admin/empleados-usuarios'] },
                            { label: 'Países', icon: 'pi pi-fw pi-globe', routerLink: ['/admin/paises'] },
                            { label: 'Estados', icon: 'pi pi-fw pi-map', routerLink: ['/admin/estados'] },
                            { label: 'Áreas', icon: 'pi pi-fw pi-sitemap', routerLink: ['/admin/areas'] },
                            { label: 'Series', icon: 'pi pi-fw pi-th-large', routerLink: ['/admin/series'] },
                            { label: 'Líneas', icon: 'pi pi-fw pi-align-justify', routerLink: ['/admin/lineas-coleccion'] }
                        ]
                    },
                    { label: 'Pedidos', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/pedidos'] }
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
            },
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                path: '/pages',
                items: [
                    {
                        label: 'Landing',
                        icon: 'pi pi-fw pi-globe',
                        routerLink: ['/landing']
                    },
                    {
                        label: 'Crud',
                        icon: 'pi pi-fw pi-pencil',
                        routerLink: ['/pages/crud']
                    },
                    {
                        label: 'Not Found',
                        icon: 'pi pi-fw pi-exclamation-circle',
                        routerLink: ['/pages/notfound']
                    },
                    {
                        label: 'Empty',
                        icon: 'pi pi-fw pi-circle-off',
                        routerLink: ['/pages/empty']
                    }
                ]
            },
            {
                label: 'Hierarchy',
                path: '/hierarchy',
                items: [
                    {
                        label: 'Submenu 1',
                        icon: 'pi pi-fw pi-bookmark',
                        path: '/hierarchy/submenu_1',
                        items: [
                            {
                                label: 'Submenu 1.1',
                                icon: 'pi pi-fw pi-bookmark',
                                path: '/hierarchy/submenu_1/submenu_1_1',
                                items: [
                                    { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
                                ]
                            },
                            {
                                label: 'Submenu 1.2',
                                icon: 'pi pi-fw pi-bookmark',
                                path: '/hierarchy/submenu_1/submenu_1_2',
                                items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
                            }
                        ]
                    },
                    {
                        label: 'Submenu 2',
                        icon: 'pi pi-fw pi-bookmark',
                        path: '/hierarchy/submenu_2',
                        items: [
                            {
                                label: 'Submenu 2.1',
                                icon: 'pi pi-fw pi-bookmark',
                                path: '/hierarchy/submenu_2/submenu_2_1',
                                items: [
                                    { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
                                    { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
                                ]
                            },
                            {
                                label: 'Submenu 2.2',
                                icon: 'pi pi-fw pi-bookmark',
                                path: '/hierarchy/submenu_2/submenu_2_2',
                                items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
                            }
                        ]
                    }
                ]
            },
            {
                label: 'Get Started',
                items: [
                    {
                        label: 'Documentation',
                        icon: 'pi pi-fw pi-book',
                        routerLink: ['/documentation']
                    },
                    {
                        label: 'View Source',
                        icon: 'pi pi-fw pi-github',
                        url: 'https://github.com/primefaces/sakai-ng',
                        target: '_blank'
                    }
                ]
            }
        ];
    }
}
