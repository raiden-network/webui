import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import { Animations } from '../../../animations/animations';
import { MediaObserver } from '@angular/flex-layout';

@Component({
    selector: 'app-page-item',
    templateUrl: './page-item.component.html',
    styleUrls: ['./page-item.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: Animations.flyInOut
})
export class PageItemComponent implements OnInit {
    @Input() showActions = true;
    @Input() mobileClass = 'card-mobile';
    @Input() cardClass = 'card';

    constructor(private mediaObserver: MediaObserver) {}

    ngOnInit() {}

    isMobile(): boolean {
        return this.mediaObserver.isActive('xs');
    }
}
