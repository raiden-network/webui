import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NotificationMessage } from '../../../models/notification';
import { IdenticonCacheService } from '../../../services/identicon-cache.service';
import { AddressBookService } from '../../../services/address-book.service';

@Component({
    selector: 'app-notification-item',
    templateUrl: './notification-item.component.html',
    styleUrls: ['./notification-item.component.css'],
})
export class NotificationItemComponent implements OnInit {
    @Input() notification: NotificationMessage;
    @Input() removable = true;
    @Output() remove: EventEmitter<boolean> = new EventEmitter();

    constructor(
        private identiconCache: IdenticonCacheService,
        private addressBookService: AddressBookService
    ) {}

    ngOnInit() {}

    identicon(address: string) {
        return this.identiconCache.getIdenticon(address);
    }

    addressLabel(address: string): string | undefined {
        return this.addressBookService.get()[address];
    }
}
