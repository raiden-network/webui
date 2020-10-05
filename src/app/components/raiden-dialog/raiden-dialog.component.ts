import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-raiden-dialog',
    templateUrl: './raiden-dialog.component.html',
    styleUrls: ['./raiden-dialog.component.scss'],
})
export class RaidenDialogComponent implements OnInit {
    @Input() titleText: string;
    @Input() acceptText: string;
    @Input() acceptDisabled: boolean;
    @Input() noButtons = false;
    @Output() accept: EventEmitter<boolean> = new EventEmitter();
    @Output() cancel: EventEmitter<boolean> = new EventEmitter();

    constructor() {}

    ngOnInit() {}

    onEnter() {
        if (!this.acceptDisabled) {
            this.accept.emit(true);
        }
    }
}
