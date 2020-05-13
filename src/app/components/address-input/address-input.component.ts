import {
    Component,
    forwardRef,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
    ElementRef,
} from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator,
    FormControl,
    Validators,
} from '@angular/forms';
import { IdenticonCacheService } from '../../services/identicon-cache.service';
import { RaidenService } from '../../services/raiden.service';
import { AddressBookService } from '../../services/address-book.service';
import { Contact } from '../../models/contact';
import { debounceTime, map, tap, switchMap, takeUntil } from 'rxjs/operators';
import {
    merge,
    Observable,
    of,
    partition,
    combineLatest,
    BehaviorSubject,
    Subject,
} from 'rxjs';
import AddressUtils from '../../utils/address-utils';
import { isAddressValid } from '../../shared/address.validator';
import { Network } from '../../utils/network-info';
import { Animations } from '../../animations/animations';
import { matchesContact } from '../../shared/keyword-matcher';

@Component({
    selector: 'app-address-input',
    templateUrl: './address-input.component.html',
    styleUrls: ['./address-input.component.css'],
    animations: Animations.fallDown,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AddressInputComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => AddressInputComponent),
            multi: true,
        },
    ],
})
export class AddressInputComponent
    implements ControlValueAccessor, Validator, OnInit, OnDestroy {
    @Input() placeholder: string;
    @Input() displayIdenticon = false;
    @Input() userAccount = false;
    @ViewChild('input', { static: true }) private inputElement: ElementRef;

    address = '';
    errors: ValidationErrors | null = { empty: true };
    touched = false;
    searching = false;
    filteredOptions$: Observable<Contact[]>;
    readonly network$: Observable<Network>;
    showContactLabelInput = false;
    contactLabelFc: FormControl;

    private ngUnsubscribe = new Subject();
    private inputSubject: BehaviorSubject<string> = new BehaviorSubject('');
    private contactLabel: string | undefined;
    private propagateTouched = () => {};
    private propagateChange = (address: string) => {};

    constructor(
        private identiconCacheService: IdenticonCacheService,
        private raidenService: RaidenService,
        private addressBookService: AddressBookService
    ) {
        this.network$ = raidenService.network$;
    }

    ngOnInit() {
        this.setupValidation();

        if (this.userAccount) {
            this.setupFiltering();
        }
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    registerOnChange(fn: any) {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any) {
        this.propagateTouched = fn;
    }

    writeValue(obj: any) {
        if (!obj || typeof obj !== 'string') {
            return;
        }
        this.inputElement.nativeElement.value = obj;
        this.onChange(obj);
    }

    validate(c: AbstractControl): ValidationErrors | null {
        return this.errors;
    }

    setDisabledState(isDisabled: boolean) {
        this.inputElement.nativeElement.disabled = isDisabled;
    }

    onChange(value: string) {
        this.inputSubject.next(value);
    }

    onTouched() {
        this.touched = true;
        this.propagateTouched();
    }

    trackByFn(contact: Contact) {
        return contact.address;
    }

    checksum(): string {
        return AddressUtils.toChecksumAddress(
            this.inputElement.nativeElement.value
        );
    }

    identicon(address: string): string {
        return this.identiconCacheService.getIdenticon(address);
    }

    hint(): string | null {
        if (
            AddressUtils.isChecksum(this.address) &&
            AddressUtils.isDomain(this.inputElement.nativeElement.value)
        ) {
            return `Resolved address: ${this.address}`;
        }

        if (this.userAccount && this.contactLabel) {
            return this.contactLabel;
        }

        return null;
    }

    activateContactLabelInput() {
        this.showContactLabelInput = true;
        this.contactLabelFc = new FormControl('', Validators.required);
    }

    labelFieldOnEnter(event: Event) {
        event.stopPropagation();
        if (this.contactLabelFc.invalid) {
            return;
        }
        this.saveContact();
    }

    saveContact() {
        this.showContactLabelInput = false;
        const contact: Contact = {
            address: this.address,
            label: this.contactLabelFc.value,
        };
        this.addressBookService.save(contact);
        this.contactLabel = this.addressBookService.get()[this.address];
    }

    private setupValidation() {
        const [ens, address] = partition(
            this.inputSubject,
            (value: string | null | undefined) => AddressUtils.isDomain(value)
        );

        const resolveOnEns = combineLatest([
            ens.pipe(debounceTime(800)),
            this.network$,
        ]).pipe(
            switchMap(([value, network]) => {
                if (!network.ensSupported) {
                    return of({
                        value: '',
                        errors: { ensUnsupported: true },
                    });
                }
                return of(value).pipe(
                    tap(() => (this.searching = true)),
                    switchMap((name) =>
                        this.raidenService.resolveEnsName(name)
                    ),
                    tap(() => (this.searching = false)),
                    map((resolvedAddress) => {
                        if (resolvedAddress) {
                            return { value: resolvedAddress };
                        } else {
                            return {
                                value: '',
                                errors: {
                                    unableToResolveEns: true,
                                },
                            };
                        }
                    })
                );
            })
        );

        const handleAddress = address.pipe(
            map((value: string) => {
                const errors = isAddressValid(
                    value,
                    this.raidenService.raidenAddress
                );
                if (errors) {
                    value = '';
                }
                return {
                    value: value,
                    errors: errors,
                };
            })
        );

        merge(resolveOnEns, handleAddress)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((result: InputResult) => {
                this.address = result.value;
                this.errors = result.errors;
                this.contactLabel = this.addressBookService.get()[this.address];
                this.showContactLabelInput = false;
                this.propagateChange(this.address);
            });
    }

    private setupFiltering() {
        this.filteredOptions$ = combineLatest([
            this.inputSubject,
            this.addressBookService.getObservableArray(),
        ]).pipe(
            map(([value, contacts]) =>
                contacts.filter((contact) => matchesContact(value, contact))
            )
        );
    }
}

interface InputResult {
    value: string;
    errors: ValidationErrors;
}
