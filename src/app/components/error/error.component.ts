import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.scss']
})
export class ErrorComponent {
    @Input() errorTitle: string;
    @Input() errorDescription: string;
    @Input() buttonText: string;
    @Input() errorStacktrace: string;
    @Input() showError = false;
    @Output() buttonClicked: EventEmitter<any> = new EventEmitter();

    constructor() {}

    clicked() {
        this.buttonClicked.emit(true);
    }
}
