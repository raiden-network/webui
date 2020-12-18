import { Directive, HostListener } from '@angular/core';

@Directive({
    selector: '[appStopClickPropagation]',
})
export class StopClickPropagationDirective {
    constructor() {}

    @HostListener('click', ['$event'])
    onClick(event: Event) {
        event.stopPropagation();
    }
}
