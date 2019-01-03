import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IdenticonCacheService } from "../../services/identicon-cache.service";
import { Address } from "../../models/address";
import {
    ConfirmationDialogComponent,
    ConfirmationDialogPayload
} from "../confirmation-dialog/confirmation-dialog.component";
import { flatMap } from "rxjs/operators";
import { EMPTY, of } from "rxjs";
import { MatDialog } from "@angular/material";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";

@Component({
    selector: 'app-address-book-address',
    templateUrl: './address-book-address.component.html',
    styleUrls: ['./address-book-address.component.css']
})
export class AddressBookAddress implements OnInit {

    @Input() address: Address;
    @Output() edit: EventEmitter<boolean> = new EventEmitter();
    @Output() update: EventEmitter<Address> = new EventEmitter();
    @Output() delete: EventEmitter<Address> = new EventEmitter();

    readonly form: FormGroup = this.fb.group({
        label: new FormControl({
            value: '',
            disabled: true
        }, Validators.required)
    });

    private _editMode = false;

    get editMode(): boolean {
        return this._editMode;
    }

    constructor(
        private identiconCache: IdenticonCacheService,
        public dialog: MatDialog,
        private fb: FormBuilder
    ) {

    }

    ngOnInit() {
    }

    toggleEdit() {
        this._editMode = !this._editMode;
        this.edit.emit(this._editMode);
        const control = this.form.get('label');
        if (this._editMode) {
            control.enable({onlySelf: true})
        } else {
            control.disable({onlySelf: true})
        }
    }

    identicon(address: string) {
        return this.identiconCache.getIdenticon(address);
    }

    showConfirmation() {
        const address = this.address;
        const payload: ConfirmationDialogPayload = {
            title: 'Delete Address',
            message: `Are you sure you want to delete the entry <b>${address.label}</b> ` +
                `for address <b>${address.address}</b>.`
        };

        const dialog = this.dialog.open(ConfirmationDialogComponent, {
            width: '500px',
            data: payload
        });

        const completeIfCancel = flatMap(result => {
            if (!result) {
                return EMPTY;
            } else {
                return of(result)
            }
        });

        dialog.afterClosed()
            .pipe(completeIfCancel)
            .subscribe(() => this.delete.emit(this.address));
    }

    updated() {
        const control = this.form.get('label');
        this.update.emit({
            address: this.address.address,
            label: control.value as string
        });
        this.toggleEdit();
    }

    cancel() {
        this.form.get('label').setValue(this.address.label);
        this.toggleEdit()
    }
}
