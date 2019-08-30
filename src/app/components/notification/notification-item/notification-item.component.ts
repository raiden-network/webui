import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NotificationMessage } from '../../../models/notification';

@Component({
    selector: 'app-notification-item',
    templateUrl: './notification-item.component.html',
    styleUrls: ['./notification-item.component.css']
})
export class NotificationItemComponent implements OnInit {
    @Input() notification: NotificationMessage;
    @Input() removable = true;
    @Output() remove: EventEmitter<boolean> = new EventEmitter();

    constructor() {}

    ngOnInit() {}
}
