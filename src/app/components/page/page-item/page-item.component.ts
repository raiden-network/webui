import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import { Animations } from '../../../animations/animations';
import { MediaObserver } from '@angular/flex-layout';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-page-item',
    templateUrl: './page-item.component.html',
    styleUrls: ['./page-item.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: Animations.flyout
})
export class PageItemComponent implements OnInit {
    @Input() showActions = true;
    @Input() mobileClass = 'card-mobile';
    constructor(private mediaObserver: MediaObserver) {}

    ngOnInit() {}

    get isMobile$(): Observable<boolean> {
        return this.mediaObserver.media$.pipe(
            map(change => {
                return change.mqAlias === 'xs';
            })
        );
    }
}
