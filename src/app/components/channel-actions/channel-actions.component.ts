import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Channel } from '../../models/channel';
import { DepositMode } from '../../utils/helpers';

@Component({
    selector: 'app-channel-actions',
    templateUrl: './channel-actions.component.html',
    styleUrls: ['./channel-actions.component.css']
})
export class ChannelActionsComponent implements OnInit {
    @Input() channel: Channel;
    @Output() openPayDialog: EventEmitter<boolean> = new EventEmitter();
    @Output() openCloseDialog: EventEmitter<boolean> = new EventEmitter();
    @Output() openDepositDialog: EventEmitter<DepositMode> = new EventEmitter();
    constructor() {}

    ngOnInit() {}

    deposit() {
        this.openDepositDialog.emit(DepositMode.DEPOSIT);
    }

    withdraw() {
        this.openDepositDialog.emit(DepositMode.WITHDRAW);
    }
}
