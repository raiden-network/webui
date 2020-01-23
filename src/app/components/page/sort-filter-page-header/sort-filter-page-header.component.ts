import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SortingData } from '../../../models/sorting.data';
import { MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import {
    FilterDialogComponent,
    FilterDialogPayload
} from '../dialogs/filter-dialog/filter-dialog.component';
import {
    SortDialogComponent,
    SortDialogPayload
} from '../dialogs/sort-dialog/sort-dialog.component';

@Component({
    selector: 'app-page-header',
    templateUrl: './sort-filter-page-header.component.html',
    styleUrls: ['./sort-filter-page-header.component.scss']
})
export class SortFilterPageHeaderComponent implements OnInit {
    @Input() label: string;
    @Input() total: number;
    @Input() keyword: string;
    @Input() showButton = true;
    @Input() buttonDescription: string;
    @Input() sortingOptions: SortingData[];
    @Input() ascending: boolean;
    @Input() sorting: number;

    @Output() added: EventEmitter<void> = new EventEmitter();
    @Output() filtered: EventEmitter<string> = new EventEmitter();
    @Output() cleared: EventEmitter<void> = new EventEmitter();
    @Output() sorted: EventEmitter<number> = new EventEmitter();
    @Output() ordered: EventEmitter<void> = new EventEmitter();

    constructor(
        private mediaObserver: MediaObserver,
        public dialog: MatDialog
    ) {}

    isMobile(): boolean {
        return this.mediaObserver.isActive('xs');
    }

    ngOnInit() {}

    add() {
        this.added.emit(null);
    }

    filter() {
        this.filtered.emit(this.keyword);
    }

    openFilterDialog() {
        const payload: FilterDialogPayload = {
            keyword: this.keyword
        };

        const dialogRef = this.dialog.open(FilterDialogComponent, {
            data: payload,
            width: '360px'
        });

        dialogRef.afterClosed().subscribe(value => {
            if (!value) {
                return;
            }

            const result = value as FilterDialogPayload;
            if (!result.keyword) {
                this.clear();
            } else {
                this.keyword = result.keyword;
                this.filter();
            }
        });
    }

    sort(sorting: number) {
        this.sorted.emit(sorting);
    }

    openSortDialog() {
        const payload: SortDialogPayload = {
            ascending: this.ascending,
            sorting: this.sorting,
            sortingOptions: this.sortingOptions
        };

        const dialogRef = this.dialog.open(SortDialogComponent, {
            data: payload,
            width: '360px'
        });

        dialogRef.afterClosed().subscribe(value => {
            if (!value) {
                return;
            }

            const result = value as SortDialogPayload;

            if (this.sorting !== result.sorting) {
                this.sorting = result.sorting;
                this.sort(this.sorting);
            }

            if (this.ascending !== result.ascending) {
                this.ascending = result.ascending;
                this.order();
            }
        });
    }

    clear() {
        this.cleared.emit(null);
    }

    order() {
        this.ordered.emit(null);
    }
}
