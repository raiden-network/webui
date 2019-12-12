import {
    Component,
    EventEmitter,
    forwardRef,
    OnInit,
    Output,
    Input
} from '@angular/core';
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
import { Observable } from 'rxjs';
import { flatMap, map, share, startWith } from 'rxjs/operators';
import { UserToken } from '../../models/usertoken';
import { RaidenService } from '../../services/raiden.service';
import { checkAddressChecksum, toChecksumAddress } from 'web3-utils';
import { TokenUtils } from '../../utils/token.utils';

@Component({
    selector: 'app-token-network-selector',
    templateUrl: './token-network-selector.component.html',
    styleUrls: ['./token-network-selector.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TokenNetworkSelectorComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => TokenNetworkSelectorComponent),
            multi: true
        }
    ]
})
export class TokenNetworkSelectorComponent
    implements OnInit, ControlValueAccessor, Validator {
    @Input() onlyConnectedTokens = false;
    @Output() valueChanged = new EventEmitter<UserToken>();
    public filteredOptions$: Observable<UserToken[]>;
    readonly tokenFc = new FormControl('', [this.addressValidatorFn()]);
    private tokens$: Observable<UserToken[]>;

    constructor(private raidenService: RaidenService) {}

    ngOnInit() {
        this.tokens$ = this.raidenService.getTokens().pipe(
            map(value =>
                this.onlyConnectedTokens
                    ? value.filter(token => !!token.connected)
                    : value
            ),
            map(value => value.sort(TokenUtils.compareTokens)),
            share()
        );

        this.filteredOptions$ = this.tokenFc.valueChanges.pipe(
            startWith(''),
            flatMap(value => this._filter(value))
        );
    }

    // noinspection JSMethodCanBeStatic
    trackByFn(token: UserToken): string {
        return token.address;
    }

    tokenSelected(value: UserToken) {
        this.tokenFc.setValue(value.address);
    }

    registerOnChange(fn: any): void {
        this.tokenFc.valueChanges.subscribe(fn);
    }

    registerOnTouched(fn: any): void {
        this.tokenFc.registerOnChange(fn);
    }

    registerOnValidatorChange(fn: () => void): void {}

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.tokenFc.disable();
        } else {
            this.tokenFc.enable();
        }
    }

    validate(c: AbstractControl): ValidationErrors | null {
        if (!this.tokenFc.value) {
            return { empty: true };
        }

        const errors = this.tokenFc.errors;
        if (!errors) {
            const userToken = this.raidenService.getUserToken(c.value);
            this.valueChanged.emit(userToken);
        }
        return errors;
    }

    writeValue(obj: any): void {
        if (!obj) {
            this.tokenFc.reset('', { emitEvent: false });
            return;
        }
        this.tokenFc.setValue(obj, { emitEvent: false });
    }

    checksum(): string {
        return toChecksumAddress(this.tokenFc.value);
    }

    private _filter(value?: string): Observable<UserToken[]> {
        if (!value || typeof value !== 'string') {
            return this.tokens$;
        }

        const keyword = value.toLowerCase();

        function matches(token: UserToken) {
            const name = token.name.toLocaleLowerCase();
            const symbol = token.symbol.toLocaleLowerCase();
            const address = token.address.toLocaleLowerCase();
            return (
                name.startsWith(keyword) ||
                symbol.startsWith(keyword) ||
                address.startsWith(keyword)
            );
        }

        return this.tokens$.pipe(
            map((tokens: UserToken[]) => tokens.filter(matches))
        );
    }

    private addressValidatorFn(): ValidatorFn {
        return (control: AbstractControl) => {
            const controlValue = control.value;
            if (
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
}
