import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewEncapsulation
} from '@angular/core';

@Component({
    selector: 'app-navigation-entry',
    templateUrl: './navigation-entry.component.html',
    styleUrls: ['./navigation-entry.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class NavigationEntryComponent implements OnInit {
    @Input()
    icon: string;
    @Input()
    text: string;
    @Input()
    route: string;

    @Output()
    readonly clicked: EventEmitter<null> = new EventEmitter();

    constructor() {}

    ngOnInit() {}

    click() {
        this.clicked.emit(null);
    }
}
