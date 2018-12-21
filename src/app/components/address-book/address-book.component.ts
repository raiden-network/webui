import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup } from "@angular/forms";
import { addressValidator } from "../../shared/address.validator";
import { IdenticonCacheService } from "../../services/identicon-cache.service";
import { Address } from "../../models/address";
import { AddressBookService } from "../../services/address-book.service";

@Component({
    selector: 'app-address-book',
    templateUrl: './address-book.component.html',
    styleUrls: ['./address-book.component.css']
})
export class AddressBookComponent implements OnInit {
    public readonly form: FormGroup = this.fb.group({
        address: ['', addressValidator()],
        label: ['', (control: AbstractControl) => !control.value]
    });
    trackByFn: any;

    visibleAddresses: Array<Address>;

    constructor(
        private fb: FormBuilder,
        private identiconCache: IdenticonCacheService,
        private addressBookService: AddressBookService
    ) {
    }

    ngOnInit() {
        this.visibleAddresses = this.addressBookService.getAddresses()
    }

    identicon(address: string) {
        return this.identiconCache.getIdenticon(address);
    }

    save() {
        const address: Address = {
            address: this.form.get('address').value,
            label: this.form.get('label').value
        };

        this.addressBookService.saveAddress(address)
    }
}
