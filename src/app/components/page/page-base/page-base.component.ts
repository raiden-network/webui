import {
    ChangeDetectionStrategy,
    Component,
    Directive,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

@Directive({
    selector: '[pageHeader]'
})
export class PageHeaderDirective {}

@Directive({
    selector: '[pageItem]'
})
export class PageItemDirective {}

@Component({
    selector: 'app-page-base',
    templateUrl: './page-base.component.html',
    styleUrls: ['./page-base.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageBaseComponent implements OnInit {
    @ViewChild(MatPaginator, { static: true })
    paginator: MatPaginator;
    @Input()
    totalElements: number;
    @Input()
    pageSize = 10;
    @Input()
    refreshing: boolean;
    @Input()
    noItemsMessage: string;

    readonly pageSizeOptions: number[] = [5, 10, 25, 50, 100];

    @Output()
    readonly pageChanged: EventEmitter<PageEvent> = new EventEmitter();

    constructor() {}

    ngOnInit() {}

    onPageEvent($event: PageEvent) {
        this.pageChanged.emit($event);
    }

    hasNoItems(): boolean {
        return this.totalElements === 0 && !this.refreshing;
    }

    isLoading() {
        return this.totalElements === 0 && this.refreshing;
    }

    firstPage() {
        this.paginator.firstPage();
    }
}
