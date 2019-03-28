import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Channel } from '../../models/channel';

@Component({
    selector: 'app-channel-actions',
    templateUrl: './channel-actions.component.html',
    styleUrls: ['./channel-actions.component.css']
})
export class ChannelActionsComponent implements OnInit {
    @Input() channel: Channel;
    @Output() openPayDialog: EventEmitter<boolean> = new EventEmitter();
    @Output() openCloseDialog: EventEmitter<boolean> = new EventEmitter();
    @Output() openDepositDialog: EventEmitter<boolean> = new EventEmitter();
    constructor() {}

    ngOnInit() {}
}
