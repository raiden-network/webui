import { Component, OnInit, Input } from '@angular/core';
import { Channel } from '../../models/channel';
import { IdenticonCacheService } from '../../services/identicon-cache.service';
import { AddressBookService } from '../../services/address-book.service';

@Component({
    selector: 'app-channel',
    templateUrl: './channel.component.html',
    styleUrls: ['./channel.component.css']
})
export class ChannelComponent implements OnInit {
    @Input() channel: Channel;

    constructor(
        private identiconCacheService: IdenticonCacheService,
        private addressBookService: AddressBookService
    ) {}

    ngOnInit() {}

    identicon(channel: Channel): string {
        return this.identiconCacheService.getIdenticon(channel.partner_address);
    }

    addressLabel(address: string): string | undefined {
        return this.addressBookService.get()[address];
    }
}
