import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import { Animations } from '../../../animations/animations';

@Component({
    selector: 'app-page-item',
    templateUrl: './page-item.component.html',
    styleUrls: ['./page-item.component.css'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: Animations.flyout
})
export class PageItemComponent implements OnInit {
    constructor() {}

    ngOnInit() {}
}
