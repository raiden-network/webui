import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { Contact } from '../../models/contact';

@Component({
    selector: 'app-add-address-dialog',
    templateUrl: './add-address-dialog.component.html',
    styleUrls: ['./add-address-dialog.component.css']
})
export class AddAddressDialogComponent implements OnInit {
    readonly form = this.fb.group({
        address: '',
        label: ''
    });

    constructor(
        public dialogRef: MatDialogRef<AddAddressDialogComponent>,
        private fb: FormBuilder
    ) {}

    ngOnInit() {}

    confirm() {
        const result: Contact = {
            address: this.form.get('address').value,
            label: this.form.get('label').value
        };
        this.dialogRef.close(result);
    }

    isValid(field: 'address' | 'label'): boolean {
        const form = this.form;
        const control = form.get(field);
        return control.invalid && (control.dirty || control.touched);
    }
}
