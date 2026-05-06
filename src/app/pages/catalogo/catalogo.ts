import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'p-catalogo',
    standalone: true,
    imports: [RouterModule],
    template: `
        <router-outlet></router-outlet>
    `
})
export class Catalogo {}
