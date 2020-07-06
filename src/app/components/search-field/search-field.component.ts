import {
    Component,
    OnInit,
    ElementRef,
    ViewChild,
    OnDestroy,
} from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { AddressBookService } from '../../services/address-book.service';
import { map, takeUntil } from 'rxjs/operators';
import { Observable, BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { UserToken } from '../../models/usertoken';
import { Contact } from '../../models/contact';
import { TokenPollingService } from '../../services/token-polling.service';
import { matchesToken, matchesContact } from '../../shared/keyword-matcher';
import { RaidenService } from '../../services/raiden.service';
import { SelectedTokenService } from '../../services/selected-token.service';
import { MediaObserver } from '@angular/flex-layout';

@Component({
    selector: 'app-search-field',
    templateUrl: './search-field.component.html',
    styleUrls: ['./search-field.component.css'],
})
export class SearchFieldComponent implements OnInit, OnDestroy {
    @ViewChild('search_input', { static: true })
    private inputElement: ElementRef;

    filteredTokenOptions$: Observable<UserToken[]>;
    filteredContactOptions$: Observable<Contact[]>;

    private inputSubject: BehaviorSubject<string> = new BehaviorSubject('');
    private ngUnsubscribe = new Subject();

    constructor(
        private sharedService: SharedService,
        private addressBookService: AddressBookService,
        private tokenPollingService: TokenPollingService,
        private raidenService: RaidenService,
        private selectedTokenService: SelectedTokenService,
        private mediaObserver: MediaObserver
    ) {}

    ngOnInit() {
        this.setupFiltering();

        this.selectedTokenService.selectedToken$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((token) => {
                const searchedToken = this.raidenService.getUserToken(
                    this.inputElement.nativeElement.value
                );
                if (
                    searchedToken &&
                    token?.address !== this.inputElement.nativeElement.value
                ) {
                    this.resetInput();
                }
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
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
        if (token) {
            this.sharedService.setSearchValue('');
            this.selectedTokenService.setToken(token);
        } else {
            this.sharedService.setSearchValue(value);
        }
    }

    resetSearch() {
        const searchedToken = this.raidenService.getUserToken(
            this.inputElement.nativeElement.value
        );
        this.resetInput();
        this.sharedService.setSearchValue('');
        if (searchedToken) {
            this.selectedTokenService.resetToken();
        }
    }

    isMobile(): boolean {
        return this.mediaObserver.isActive('xs');
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

    private resetInput() {
        this.inputElement.nativeElement.value = '';
        this.inputSubject.next('');
    }
}
