import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'p-footer',
    template: `<div class="layout-footer">
        Creado por
        <a href="https://www.rinatstore.com/" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">Rinat</a>
    </div>`
})
export class AppFooter { }
