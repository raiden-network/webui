import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { AddressBookService } from '../../services/address-book.service';
import { map } from 'rxjs/operators';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { UserToken } from '../../models/usertoken';
import { Contact } from '../../models/contact';
import { TokenPollingService } from '../../services/token-polling.service';
import { matchesToken, matchesContact } from '../../shared/keyword-matcher';
import { RaidenService } from '../../services/raiden.service';
import { SelectedTokenService } from '../../services/selected-token.service';

@Component({
    selector: 'app-search-field',
    templateUrl: './search-field.component.html',
    styleUrls: ['./search-field.component.css'],
})
export class SearchFieldComponent implements OnInit {
    @ViewChild('search_input', { static: true })
    private inputElement: ElementRef;

    filteredTokenOptions$: Observable<UserToken[]>;
    filteredContactOptions$: Observable<Contact[]>;

    private inputSubject: BehaviorSubject<string> = new BehaviorSubject('');

    constructor(
        private sharedService: SharedService,
        private addressBookService: AddressBookService,
        private tokenPollingService: TokenPollingService,
        private raidenService: RaidenService,
        private selectedTokenService: SelectedTokenService
    ) {}

    ngOnInit() {
        this.setupFiltering();
    }

    tokenTrackByFn(token: UserToken) {
        return token.address;
    }

    contactTrackByFn(contact: Contact) {
        return contact.address;
    }

    onInput(value: string) {
        this.inputSubject.next(value);
        const token = this.raidenService.getUserToken(value);
        this.selectedTokenService.setToken(token);
        if (token) {
            this.sharedService.setSearchValue('');
        } else {
            this.sharedService.setSearchValue(value);
        }
    }

    resetInput() {
        this.inputElement.nativeElement.value = '';
        this.inputSubject.next('');
        this.sharedService.setSearchValue('');
    }

    private setupFiltering() {
        this.filteredTokenOptions$ = combineLatest([
            this.inputSubject,
            this.tokenPollingService.tokens$,
        ]).pipe(
            map(([filterValue, tokens]) =>
                tokens.filter((token) => matchesToken(filterValue, token))
            )
        );

        this.filteredContactOptions$ = combineLatest([
            this.inputSubject,
            this.addressBookService.getObservableArray(),
        ]).pipe(
            map(([filterValue, contacts]) =>
                contacts.filter((contact) =>
                    matchesContact(filterValue, contact)
                )
            )
        );
    }
}
