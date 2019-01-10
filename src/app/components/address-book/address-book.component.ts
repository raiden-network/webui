import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import { addressValidator } from '../../shared/address.validator';
import { Address } from '../../models/address';
import { AddressBookService } from '../../services/address-book.service';
import { MatDialog, PageEvent } from '@angular/material';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { IdenticonCacheService } from '../../services/identicon-cache.service';
import { UploadError } from '../../model/upload-error';
import {
    ConfirmationDialogComponent,
    ConfirmationDialogPayload
} from '../confirmation-dialog/confirmation-dialog.component';
import { flatMap } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';

@Component({
    selector: 'app-address-book',
    templateUrl: './address-book.component.html',
    styleUrls: ['./address-book.component.scss'],
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
    private _editedAddress: string;

    public get uploadError(): UploadError {
        return this._uploadError;
    }

    constructor(
        private fb: FormBuilder,
        private addressBookService: AddressBookService,
        private identiconService: IdenticonCacheService,
        public dialog: MatDialog
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

    get editedAddress(): string {
        return this._editedAddress;
    }

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
        const start = this.pageSize * this.currentPage;
        this.visibleAddresses = addresses.slice(start, start + this.pageSize);
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
        this.updateVisibleAddresses();
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

    confirmDelete() {
        const payload: ConfirmationDialogPayload = {
            title: 'Delete Address Book',
            message: 'This action will delete all your stored addresses. <br/> ' +
                'Unless you exported your Address book all your addresses will be lost. <br/>' +
                'Are you sure you want to continue?'
        };

        const dialog = this.dialog.open(ConfirmationDialogComponent, {
            width: '500px',
            data: payload
        });

        dialog.afterClosed().pipe(
            flatMap(result => {
                if (!result) {
                    return EMPTY;
                }

                return of(result);
            })
        ).subscribe(() => {
            this.addressBookService.deleteAll();
            this.updateVisibleAddresses();
        });
    }

    setEdited(address: string) {
        this._editedAddress = address;
    }

    cancelled() {
        this._editedAddress = undefined;
    }
}
