import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { GestorCloudinaryComponent } from './gestor-cloudinary/gestor-cloudinary.component';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'empty', component: Empty },
    { path: 'gestor-cloudinary', component: GestorCloudinaryComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
