import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Asignaciones } from './app/pages/asignaciones/asignaciones';
import { AdminClientesUsuarios } from './app/pages/admin/admin-clientes-usuarios';
import { AdminEmpleadosUsuarios } from './app/pages/admin/admin-empleados-usuarios';
import { AdminPaisesComponent } from './app/pages/admin/admin-paises';
import { AdminEstadosComponent } from './app/pages/admin/admin-estados';
import { AdminAreasComponent } from './app/pages/admin/admin-areas';
import { authGuard } from './app/core/guards/auth.guard';
import { adminGuard } from './app/core/guards/admin.guard';
import { Catalogo } from './app/pages/catalogo/catalogo';
import { CatalogoPrecios } from './app/pages/catalogo/catalogo-precios';
import { CatalogoProductos } from './app/pages/catalogo/catalogo-productos';
import { CatalogoSkus } from './app/pages/catalogo/catalogo-skus';
import { CatalogoVariantes } from './app/pages/catalogo/catalogo-variantes';
import { CatalogoGamas } from './app/pages/catalogo/catalogo-gamas';
import { AdminSeriesComponent } from './app/pages/admin/admin-series';
import { AdminLineasColeccionComponent } from './app/pages/admin/admin-lineas-coleccion';
import { AdminCatalogosComponent } from './app/pages/admin/admin-catalogos';
import { ClientesAdminComponent } from './app/pages/clientes/clientes-admin';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Empleados } from './app/pages/empleados/empleados';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { Usuarios } from './app/pages/usuarios/usuarios';
import { Pedidos } from './app/pages/pedidos/pedidos';
import { ProductosGuante } from './app/pages/productos-guante/productos-guante';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        children: [
            { path: '', component: Dashboard },
            {
                path: 'admin',
                canActivate: [adminGuard],
                canActivateChild: [adminGuard],
                children: [
                    { path: '', redirectTo: 'clientes-usuarios', pathMatch: 'full' },
                    { path: 'clientes-usuarios', component: AdminClientesUsuarios },
                    { path: 'empleados-usuarios', component: AdminEmpleadosUsuarios },
                    { path: 'paises', component: AdminPaisesComponent },
                    { path: 'estados', component: AdminEstadosComponent },
                    { path: 'areas', component: AdminAreasComponent },
                    { path: 'series', component: AdminSeriesComponent },
                    { path: 'lineas-coleccion', component: AdminLineasColeccionComponent },
                    { path: 'catalogos', component: AdminCatalogosComponent },
                    { path: 'usuarios', component: Usuarios },
                    { path: 'empleados-password', redirectTo: 'empleados-usuarios', pathMatch: 'full' }
                ]
            },
            { path: 'asignaciones', component: Asignaciones },
            {
                path: 'catalogo',
                component: Catalogo,
                children: [
                    { path: '', redirectTo: 'productos', pathMatch: 'full' },
                    { path: 'productos', component: CatalogoProductos },
                    { path: 'variantes', component: CatalogoVariantes },
                    { path: 'skus', component: CatalogoSkus },
                    { path: 'precios', component: CatalogoPrecios },
                    { path: 'gamas', component: CatalogoGamas }
                ]
            },
            {
                path: 'productos',
                children: [
                    { path: 'guantes', component: ProductosGuante }
                ]
            },
            { path: 'clientes', component: ClientesAdminComponent },
            { path: 'empleados', component: Empleados },
            { path: 'pedidos', component: Pedidos },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'landing', component: Landing, canActivate: [authGuard] },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
