import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, EMPTY, combineLatest } from 'rxjs';
import { map, share, mergeMap } from 'rxjs/operators';
import { UserToken } from '../../models/usertoken';
import { RaidenService } from '../../services/raiden.service';
import { TokenPollingService } from '../../services/token-polling.service';
import { MatDialog } from '@angular/material/dialog';
import { RegisterDialogComponent } from '../register-dialog/register-dialog.component';
import { SelectedTokenService } from '../../services/selected-token.service';
import { UserDepositService } from 'app/services/user-deposit.service';

@Component({
    selector: 'app-token-network-selector',
    templateUrl: './token-network-selector.component.html',
    styleUrls: ['./token-network-selector.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => TokenNetworkSelectorComponent),
            multi: true,
        },
    ],
})
export class TokenNetworkSelectorComponent
    implements ControlValueAccessor, OnInit
{
    @Input() onlyConnectedTokens = false;
    @Input() showOnChainBalance = false;
    @Input() showChannelBalance = false;
    @Input() showRegisterButton = false;
    @Input() setSelectedToken = false;
    @Input() showEthOption = false;
    @Input() showServicesToken = false;
    @Input() triggerText = '';
    @Input() placeholder = 'Token Network';
    @Input() selectorClass = '';
    @Input() panelClass = '';
    @Input() value: UserToken | 'ETH';

    tokens$: Observable<UserToken[]>;
    readonly ethBalance$: Observable<string>;

    constructor(
        private tokenPollingService: TokenPollingService,
        private raidenService: RaidenService,
        private dialog: MatDialog,
        private selectedTokenService: SelectedTokenService,
        private userDepositService: UserDepositService
    ) {
        this.tokens$ = this.tokenPollingService.tokens$.pipe(
            map((value) =>
                this.onlyConnectedTokens
                    ? value.filter((token) => !!token.connected)
                    : value
            ),
            share()
        );
        this.ethBalance$ = this.raidenService.balance$;
    }

    ngOnInit() {
        if (this.showServicesToken) {
            this.tokens$ = combineLatest([
                this.tokens$,
                this.userDepositService.servicesToken$,
            ]).pipe(
                map(([tokens, servicesToken]) => [servicesToken, ...tokens])
            );
        }
    }

    registerOnChange(fn: any) {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any) {
        this.propagateTouched = fn;
    }

    writeValue(obj: any) {
        if (!obj || (!obj.address && obj !== 'ETH')) {
            return;
        }
        this.value = obj;
        this.onChange(obj);
    }

    onChange(value: UserToken | 'ETH') {
        this.propagateChange(value);
        if (this.setSelectedToken && value !== 'ETH') {
            this.selectedTokenService.setToken(value);
        }
    }

    onTouched() {
        this.propagateTouched();
    }

    trackByFn(value: UserToken | 'ETH'): string {
        return value === 'ETH' ? value : value.address;
    }

    register() {
        const dialog = this.dialog.open(RegisterDialogComponent, {});

        dialog
            .afterClosed()
            .pipe(
                mergeMap((tokenAddress: string) => {
                    if (!tokenAddress) {
                        return EMPTY;
                    }

                    return this.raidenService.registerToken(tokenAddress);
                })
            )
            .subscribe(() => {
                this.tokenPollingService.refresh();
            });
    }

    private propagateTouched = () => {};
    private propagateChange = (token: UserToken | 'ETH') => {};
}
