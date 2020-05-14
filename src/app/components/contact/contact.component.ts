import {
    Component,
    OnInit,
    Input,
    OnDestroy,
    ViewChild,
    ElementRef,
} from '@angular/core';
import { Contact } from '../../models/contact';
import { Animations } from '../../animations/animations';
import { IdenticonCacheService } from '../../services/identicon-cache.service';
import { SharedService } from '../../services/shared.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.css'],
    animations: Animations.flyInOut,
})
export class ContactComponent implements OnInit, OnDestroy {
    @Input() contact: Contact;

    @ViewChild('card', { static: true })
    private cardElement: ElementRef;

    selected = false;

    private ngUnsubscribe = new Subject();

    constructor(
        private identiconCache: IdenticonCacheService,
        private sharedService: SharedService
    ) {}

    ngOnInit() {
        this.sharedService.globalClickTarget$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((target) => {
                if (!this.cardElement.nativeElement.contains(target)) {
                    this.selected = false;
                }
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    identicon(address: string) {
        return this.identiconCache.getIdenticon(address);
    }
}
