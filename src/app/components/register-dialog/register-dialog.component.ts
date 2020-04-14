import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-register-dialog',
    templateUrl: './register-dialog.component.html',
    styleUrls: ['./register-dialog.component.css'],
})
export class RegisterDialogComponent {
    readonly form = this.fb.group({
        token_address: ['', Validators.required],
    });

    constructor(
        private dialogRef: MatDialogRef<RegisterDialogComponent>,
        private fb: FormBuilder
    ) {}

    accept() {
        const tokenAddress = this.form.get('token_address').value;
        this.dialogRef.close(tokenAddress);
    }

    cancel() {
        this.dialogRef.close();
    }
}
