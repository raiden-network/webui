import {
    Component,
    forwardRef,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
    ElementRef
} from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator
} from '@angular/forms';
import { IdenticonCacheService } from '../../services/identicon-cache.service';
import { RaidenService } from '../../services/raiden.service';
import { AddressBookService } from '../../services/address-book.service';
import { Contact } from '../../models/contact';
import {
    debounceTime,
    map,
    tap,
    switchMap,
    startWith,
    flatMap
} from 'rxjs/operators';
import {
    merge,
    Observable,
    of,
    Subscription,
    partition,
    combineLatest,
    BehaviorSubject
} from 'rxjs';
import AddressUtils from '../../utils/address-utils';
import { isAddressValid } from '../../shared/address.validator';
import { Network } from '../../utils/network-info';
import { Animations } from '../../animations/animations';

@Component({
    selector: 'app-address-input',
    templateUrl: './address-input.component.html',
    styleUrls: ['./address-input.component.css'],
    animations: Animations.fallDown,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AddressInputComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => AddressInputComponent),
            multi: true
        }
    ]
})
export class AddressInputComponent
    implements ControlValueAccessor, Validator, OnInit, OnDestroy {
    @Input() placeholder: string;
    @Input() errorPlaceholder: string;
    @Input() displayIdenticon = false;
    @Input() userAccount = false;
    @ViewChild('input', { static: true }) private inputElement: ElementRef;

    address = '';
    errors: ValidationErrors | null = { empty: true };
    touched = false;
    searching = false;
    filteredOptions$: Observable<Contact[]>;
    readonly network$: Observable<Network>;

    private subscription: Subscription;
    private inputSubject: BehaviorSubject<string> = new BehaviorSubject('');
    private propagateTouched = () => {};
    private propagateChange = (address: string) => {};

    constructor(
        private identiconCacheService: IdenticonCacheService,
        private raidenService: RaidenService,
        private addressBookService: AddressBookService
    ) {
        this.network$ = raidenService.network$;
    }

    ngOnInit(): void {
        this.setupValidation();

        if (this.userAccount) {
            this.setupFiltering();
        }
    }

    ngOnDestroy(): void {
        const subscription = this.subscription;
        if (subscription) {
            subscription.unsubscribe();
        }
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

    onChange(value: any) {
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
        const label = this.addressBookService.get()[this.address];
        if (
            AddressUtils.isChecksum(this.address) &&
            AddressUtils.isDomain(this.inputElement.nativeElement.value)
        ) {
            return `Resolved address: ${this.address}`;
        } else if (label) {
            return label;
        } else {
            return null;
        }
    }

    private setupValidation() {
        const [ens, address] = partition(
            this.inputSubject,
            (value: string | null | undefined) => AddressUtils.isDomain(value)
        );

        const resolveOnEns = combineLatest([
            ens.pipe(debounceTime(800)),
            this.network$
        ]).pipe(
            switchMap(([value, network]) => {
                if (!network.ensSupported) {
                    return of({
                        value: '',
                        errors: { ensUnsupported: true }
                    });
                }
                return of(value).pipe(
                    tap(() => (this.searching = true)),
                    switchMap(name => this.raidenService.resolveEnsName(name)),
                    tap(() => (this.searching = false)),
                    map(resolvedAddress => {
                        if (resolvedAddress) {
                            return { value: resolvedAddress };
                        } else {
                            return {
                                value: '',
                                errors: {
                                    unableToResolveEns: true
                                }
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
                    errors: errors
                };
            })
        );

        this.subscription = merge(resolveOnEns, handleAddress).subscribe(
            (result: InputResult) => {
                this.address = result.value;
                this.errors = result.errors;
                this.propagateChange(this.address);
            }
        );
    }

    private setupFiltering() {
        this.filteredOptions$ = this.inputSubject.pipe(
            startWith(''),
            flatMap(value => this.filter(value))
        );
    }

    private filter(value: string): Observable<Contact[]> {
        const contacts$ = of(this.addressBookService.getArray());
        if (!value || typeof value !== 'string') {
            return contacts$;
        }

        const keyword = value.toLowerCase();

        function matches(contact: Contact) {
            const label = contact.label.toLocaleLowerCase();
            const address = contact.address.toLocaleLowerCase();
            return label.indexOf(keyword) >= 0 || address.indexOf(keyword) >= 0;
        }

        return contacts$.pipe(
            map((contacts: Contact[]) => contacts.filter(matches))
        );
    }
}

interface InputResult {
    value: string;
    errors: ValidationErrors;
}
