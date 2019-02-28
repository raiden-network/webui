import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export interface FilterDialogPayload {
    readonly keyword: string;
}

@Component({
    selector: 'app-filter-dialog',
    templateUrl: './filter-dialog.component.html',
    styleUrls: ['./filter-dialog.component.css']
})
export class FilterDialogComponent implements OnInit {
    keyword: string;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: FilterDialogPayload,
        public dialogRef: MatDialogRef<FilterDialogComponent>
    ) {
        this.keyword = data.keyword;
    }

    ngOnInit() {}

    clear() {
        const result: FilterDialogPayload = {
            keyword: ''
        };
        this.dialogRef.close(result);
    }

    apply() {
        const result: FilterDialogPayload = {
            keyword: this.keyword
        };
        this.dialogRef.close(result);
    }
}
