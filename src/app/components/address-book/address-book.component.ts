import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import { addressValidator } from '../../shared/address.validator';
import { Address } from '../../models/address';
import { AddressBookService } from '../../services/address-book.service';
import { PageEvent } from '@angular/material';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { IdenticonCacheService } from '../../services/identicon-cache.service';
import { UploadError } from '../../model/upload-error';

@Component({
    selector: 'app-address-book',
    templateUrl: './address-book.component.html',
    styleUrls: ['./address-book.component.css'],
    animations: [
        trigger('flyInOut', [
            state('in', style({opacity: 1, transform: 'translateX(0)'})),
            transition('void => *', [
                style({
                    opacity: 0,
                    transform: 'translateX(+100%)'
                }),
                animate('0.2s ease-in')
            ]),
            transition('* => void', [
                animate('0.2s 0.1s ease-out', style({
                    opacity: 0,
                    transform: 'translateX(100%)'
                }))
            ])
        ])
    ]
})
export class AddressBookComponent implements OnInit {

    public get uploadError(): UploadError {
        return this._uploadError;
    }

    constructor(
        private fb: FormBuilder,
        private addressBookService: AddressBookService,
        private identiconService: IdenticonCacheService
    ) {
    }

    public readonly form: FormGroup = this.fb.group({
        address: ['', addressValidator()],
        label: ['', (control: AbstractControl) => !control.value]
    });

    visibleAddresses: Array<Address>;
    totalAddresses: number;
    pageSize = 10;
    currentPage = 0;

    showDropArea = false;

    private _uploadError: UploadError;

    // noinspection JSMethodCanBeStatic
    trackByFn(index, item: Address) {
        return item.address;
    }

    ngOnInit() {
        this.updateVisibleAddresses();
    }

    identicon(address: string) {
        return this.identiconService.getIdenticon(address);
    }

    private updateVisibleAddresses() {
        const addresses = this.addressBookService.getArray();
        this.totalAddresses = addresses.length;
        this.visibleAddresses = addresses.slice(this.pageSize * this.currentPage, this.pageSize);
    }

    save() {
        const addressControl = this.form.get('address');
        const labelControl = this.form.get('label');
        const address: Address = {
            address: addressControl.value,
            label: labelControl.value
        };

        this.addressBookService.save(address);
        this.updateVisibleAddresses();
        addressControl.reset('');
        labelControl.reset('');
    }

    onPageEvent($event: PageEvent) {
        this.currentPage = $event.pageIndex;
    }

    deleteAddress(address: Address) {
        this.addressBookService.delete(address);
        this.updateVisibleAddresses();
    }

    updateAddress(address: Address) {
        this.addressBookService.save(address);
    }

    error(dragError: UploadError) {
        this._uploadError = dragError;
    }

    filesSelected(file: File) {
        this._uploadError = null;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                this.addressBookService.store(JSON.parse(reader.result as string));
                setTimeout(() => this.showDropArea = false, 800);
                this.updateVisibleAddresses();
            } catch (e) {
                this._uploadError = {invalidFormat: true};
            }
        };

        reader.readAsText(file);
    }

    saveAddresses() {
        const link = document.createElement('a');
        link.target = '_blank';
        link.href = this.addressBookService.createExportURL();
        link.setAttribute('visibility', 'hidden');
        link.setAttribute('download', 'address-book');
        link.click();
    }
}
