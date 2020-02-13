import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { Contact } from '../../models/contact';
import { Animations } from '../../animations/animations';
import { IdenticonCacheService } from '../../services/identicon-cache.service';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.css'],
    animations: Animations.flyInOut
})
export class ContactComponent implements OnInit {
    @Input() contact: Contact;
    @Input() selected = false;
    @Output() select: EventEmitter<boolean> = new EventEmitter();
    @Output() update: EventEmitter<boolean> = new EventEmitter();

    constructor(private identiconCache: IdenticonCacheService) {}

    ngOnInit() {}

    identicon(address: string) {
        return this.identiconCache.getIdenticon(address);
    }
}
