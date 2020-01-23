import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-raiden-dialog',
    templateUrl: './raiden-dialog.component.html',
    styleUrls: ['./raiden-dialog.component.css']
})
export class RaidenDialogComponent implements OnInit {
    @Input() title: string;
    @Input() acceptText: string;
    @Input() acceptDisabled: boolean;
    @Output() accept: EventEmitter<boolean> = new EventEmitter();
    @Output() cancel: EventEmitter<boolean> = new EventEmitter();

    constructor() {}

    ngOnInit() {}
}
