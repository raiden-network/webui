import { Component, Inject, OnInit } from '@angular/core';
import { SortingData } from '../../../models/sorting.data';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export interface SortDialogPayload {
    readonly ascending: boolean;
    readonly sorting: number;
    readonly sortingOptions: SortingData[];
}

@Component({
    selector: 'app-sort-dialog',
    templateUrl: './sort-dialog.component.html',
    styleUrls: ['./sort-dialog.component.css']
})
export class SortDialogComponent implements OnInit {
    ascending: boolean;
    sortingOptions: SortingData[];
    sorting: number;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: SortDialogPayload,
        public dialogRef: MatDialogRef<SortDialogComponent>
    ) {
        this.ascending = data.ascending;
        this.sortingOptions = data.sortingOptions;
        this.sorting = data.sorting;
    }

    ngOnInit() {}

    order() {
        this.ascending = !this.ascending;
    }

    apply() {
        const result: SortDialogPayload = {
            ascending: this.ascending,
            sorting: this.sorting,
            sortingOptions: undefined
        };

        this.dialogRef.close(result);
    }

    sort(value: number) {
        this.sorting = value;
    }
}
