import { Component, OnInit, Input } from '@angular/core';
import { IdenticonCacheService } from '../../services/identicon-cache.service';
import { AddressBookService } from '../../services/address-book.service';

@Component({
    selector: 'app-address-identicon',
    templateUrl: './address-identicon.component.html',
    styleUrls: ['./address-identicon.component.css'],
})
export class AddressIdenticonComponent implements OnInit {
    @Input() address: string;
    @Input() size = '35px';

    constructor(
        private identiconCache: IdenticonCacheService,
        private addressBookService: AddressBookService
    ) {}

    ngOnInit(): void {}

    identicon(address: string) {
        return this.identiconCache.getIdenticon(address);
    }

    addressLabel(address: string): string | undefined {
        return this.addressBookService.get()[address];
    }
}
