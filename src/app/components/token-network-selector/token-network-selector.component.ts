import {
    Component,
    EventEmitter,
    forwardRef,
    Output,
    Input
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';
import { UserToken } from '../../models/usertoken';
import { RaidenService } from '../../services/raiden.service';
import { TokenUtils } from '../../utils/token.utils';
import { TokenPollingService } from '../../services/token-polling.service';

@Component({
    selector: 'app-token-network-selector',
    templateUrl: './token-network-selector.component.html',
    styleUrls: ['./token-network-selector.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TokenNetworkSelectorComponent),
            multi: true
        }
    ]
})
export class TokenNetworkSelectorComponent implements ControlValueAccessor {
    @Input() onlyConnectedTokens = false;
    @Output() tokenChanged = new EventEmitter<UserToken>();

    value: UserToken;
    tokens$: Observable<UserToken[]>;

    private propagateTouched = () => {};
    private propagateChange = (tokenAddress: string) => {};

    constructor(
        private tokenPollingService: TokenPollingService,
        private raidenService: RaidenService
    ) {
        this.tokens$ = this.tokenPollingService.tokens$.pipe(
            map(value =>
                this.onlyConnectedTokens
                    ? value.filter(token => !!token.connected)
                    : value
            ),
            map(value => value.sort(TokenUtils.compareTokens)),
            share()
        );
    }

    registerOnChange(fn: any) {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any) {
        this.propagateTouched = fn;
    }

    writeValue(obj: any) {
        const token = this.raidenService.getUserToken(obj);
        if (!token) {
            return;
        }
        this.value = token;
        this.tokenChanged.emit(token);
    }

    onChange(value: any) {
        this.propagateChange(value.address);
        this.tokenChanged.emit(value);
    }

    onTouched() {
        this.propagateTouched();
    }

    trackByFn(token: UserToken): string {
        return token.address;
    }
}
