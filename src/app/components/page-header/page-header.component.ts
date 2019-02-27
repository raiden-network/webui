import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SortingData } from '../../models/sorting.data';

@Component({
    selector: 'app-page-header',
    templateUrl: './page-header.component.html',
    styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit {
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

    constructor() {}

    ngOnInit() {}

    add() {
        this.added.emit(null);
    }

    filter() {
        this.filtered.emit(this.keyword);
    }

    sort(sorting: number) {
        this.sorted.emit(sorting);
    }

    clear() {
        this.cleared.emit(null);
    }

    order() {
        this.ordered.emit(null);
    }
}
