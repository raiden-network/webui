import { Component, forwardRef, Input, OnInit } from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    FormControl,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator,
    ValidatorFn
} from '@angular/forms';
import { IdenticonCacheService } from '../../services/identicon-cache.service';
import { RaidenService } from '../../services/raiden.service';
import { AddressBookService } from '../../services/address-book.service';
import { Address } from '../../models/address';
import { flatMap, map, startWith } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { checkAddressChecksum, toChecksumAddress } from 'web3-utils';

@Component({
    selector: 'app-address-input',
    templateUrl: './address-input.component.html',
    styleUrls: ['./address-input.component.css'],
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
    implements ControlValueAccessor, Validator, OnInit {
    @Input() placeholder: string;
    @Input() errorPlaceholder: string;
    @Input() displayIdenticon = false;
    @Input() userAccount = false;

    readonly addressFc = new FormControl('', [
        this.addressValidatorFn(this.raidenService)
    ]);

    filteredOptions$: Observable<Address[]>;

    trackByFn(address: Address) {
        return address.address;
    }

    constructor(
        private identiconCacheService: IdenticonCacheService,
        private raidenService: RaidenService,
        private addressBookService: AddressBookService
    ) {}

    ngOnInit(): void {
        if (!this.userAccount) {
            return;
        }

        this.filteredOptions$ = this.addressFc.valueChanges.pipe(
            startWith(''),
            flatMap(value => this._filter(value))
        );
    }

    // noinspection JSMethodCanBeStatic
    identicon(address: string): string {
        return this.identiconCacheService.getIdenticon(address);
    }

    registerOnChange(fn: any): void {
        this.addressFc.valueChanges.subscribe(fn);
    }

    registerOnTouched(fn: any): void {
        this.addressFc.registerOnChange(fn);
    }

    setDisabledState(isDisabled: boolean): void {
        isDisabled ? this.addressFc.disable() : this.addressFc.enable();
    }

    writeValue(obj: any): void {
        if (!obj) {
            return;
        }
        this.addressFc.setValue(obj, { emitEvent: false });
    }

    checksum(): string {
        return toChecksumAddress(this.addressFc.value);
    }

    registerOnValidatorChange(fn: () => void): void {}

    validate(c: AbstractControl): ValidationErrors | null {
        if (!this.addressFc.value) {
            return { empty: true };
        }
        return this.addressFc.errors;
    }

    private addressValidatorFn(raidenService: RaidenService): ValidatorFn {
        return (control: AbstractControl) => {
            const controlValue = control.value;
            if (controlValue === raidenService.raidenAddress) {
                return { ownAddress: true };
            } else if (
                controlValue &&
                controlValue.length === 42 &&
                !checkAddressChecksum(controlValue)
            ) {
                return { notChecksumAddress: true };
            } else {
                return undefined;
            }
        };
    }

    private _filter(value: string | Address): Observable<Address[]> {
        const addresses$ = of(this.addressBookService.getArray());
        if (!value || typeof value !== 'string') {
            return addresses$;
        }

        const keyword = value.toLowerCase();

        function matches(addressObj: Address) {
            const label = addressObj.label.toLocaleLowerCase();
            const address = addressObj.address.toLocaleLowerCase();
            return label.indexOf(keyword) >= 0 || address.indexOf(keyword) >= 0;
        }

        return addresses$.pipe(
            map((addresses: Address[]) => addresses.filter(matches))
        );
    }
}
