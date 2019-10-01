import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmationDialogPayload {
    title: string;
    message: string;
}

@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmationDialogComponent {
    readonly title: string;
    readonly message: string;

    constructor(
        @Inject(MAT_DIALOG_DATA) public payload: ConfirmationDialogPayload,
        public dialogRef: MatDialogRef<ConfirmationDialogComponent>
    ) {
        this.title = this.payload.title;
        this.message = this.payload.message;
    }

    confirm() {
        this.dialogRef.close(true);
    }
}
