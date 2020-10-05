import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-navigation-entry',
    templateUrl: './navigation-entry.component.html',
    styleUrls: ['./navigation-entry.component.scss'],
})
export class NavigationEntryComponent implements OnInit {
    @Input()
    icon: string;
    @Input()
    text: string;
    @Input()
    route: string;

    constructor() {}

    ngOnInit() {}
}
