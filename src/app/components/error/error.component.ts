import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges
} from '@angular/core';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnChanges {
    @Input() errorTitle: string;
    @Input() errorDescription: string;
    @Input() buttonText: string;
    @Input() errorStacktrace: string;
    @Input() showError = false;
    @Output() buttonClicked: EventEmitter<any> = new EventEmitter();

    private _descriptionRows: string[] = [];

    public get descriptionRows(): string[] {
        return this._descriptionRows;
    }

    constructor() {}

    clicked() {
        this.buttonClicked.emit(true);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.hasOwnProperty('errorDescription')) {
            const change: string = changes['errorDescription'].currentValue;
            if (change) {
                this._descriptionRows = change.split('\\n');
            } else {
                this._descriptionRows = [];
            }
        }
    }
}
