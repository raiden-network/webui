import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Contact } from '../../models/contact';

export interface AddEditContactDialogPayload {
    readonly address: string;
    readonly label: string;
    readonly edit: boolean;
}

@Component({
    selector: 'app-add-edit-contact-dialog',
    templateUrl: './add-edit-contact-dialog.component.html',
    styleUrls: ['./add-edit-contact-dialog.component.css'],
})
export class AddEditContactDialogComponent implements OnInit {
    readonly form: FormGroup;
    editing: boolean;

    constructor(
        @Inject(MAT_DIALOG_DATA) data: AddEditContactDialogPayload,
        private dialogRef: MatDialogRef<AddEditContactDialogComponent>,
        private fb: FormBuilder
    ) {
        this.editing = data.edit;
        this.form = this.fb.group({
            address: [data.address, Validators.required],
            label: [data.label, Validators.required],
        });
    }

    ngOnInit() {}

    accept() {
        const result: Contact = {
            address: this.form.value.address,
            label: this.form.value.label,
        };
        this.dialogRef.close(result);
    }

    cancel() {
        this.dialogRef.close();
    }
}
