import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Animations } from 'app/animations/animations';
import { ConnectionChoice, SuggestedConnection } from 'app/models/connection';
import { UserToken } from 'app/models/usertoken';
import { ChannelPollingService } from 'app/services/channel-polling.service';
import { RaidenService } from 'app/services/raiden.service';
import { TokenPollingService } from 'app/services/token-polling.service';
import BigNumber from 'bignumber.js';
import { combineLatest, EMPTY, Observable, Subject, zip } from 'rxjs';
import {
    catchError,
    delay,
    filter,
    first,
    map,
    switchMap,
    takeUntil,
    tap,
} from 'rxjs/operators';
import { TokenInputComponent } from '../token-input/token-input.component';

export interface QuickConnectDialogPayload {
    readonly token: UserToken;
}

export interface QuickConnectDialogResult {
    readonly token: UserToken;
    readonly connectionChoices: ConnectionChoice[];
}

@Component({
    selector: 'app-quick-connect-dialog',
    templateUrl: './quick-connect-dialog.component.html',
    styleUrls: ['./quick-connect-dialog.component.scss'],
    animations: Animations.stretchInOut,
})
export class QuickConnectDialogComponent implements OnInit, OnDestroy {
    @ViewChild(TokenInputComponent, { static: true })
    private tokenInput: TokenInputComponent;

    form: FormGroup;
    initiatedWithoutToken = false;
    suggestions: SuggestedConnection[] = [];
    loading = false;
    pfsError = false;
    pfsConfigured = true;

    private ngUnsubscribe = new Subject();

    constructor(
        @Inject(MAT_DIALOG_DATA) data: QuickConnectDialogPayload,
        private dialogRef: MatDialogRef<QuickConnectDialogComponent>,
        private fb: FormBuilder,
        private tokenPollingService: TokenPollingService,
        private raidenService: RaidenService,
        private http: HttpClient,
        private channelPollingService: ChannelPollingService
    ) {
        this.initiatedWithoutToken = !data.token;
        this.form = this.fb.group({
            token: [data.token, Validators.required],
            totalAmount: ['', Validators.required],
            choices: this.fb.array([], Validators.required),
        });
    }

    ngOnInit(): void {
        this.subscribeToSuggestions();
        this.subscribeToTokenUpdates();
        this.form.controls.token.updateValueAndValidity();
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    accept() {
        const choices: ConnectionChoice[] = [];
        (this.form.get('choices') as FormArray).controls.forEach((control) => {
            const depositValue: BigNumber = control.get('deposit').value;
            if (depositValue.isGreaterThan(0)) {
                choices.push({
                    partnerAddress: control.get('partnerAddress').value,
                    deposit: depositValue,
                });
            }
        });

        const payload: QuickConnectDialogResult = {
            token: this.form.value.token,
            connectionChoices: choices,
        };
        this.dialogRef.close(payload);
    }

    cancel() {
        this.dialogRef.close();
    }

    private subscribeToSuggestions() {
        const pathfindingServiceUrl$ = this.raidenService.getSettings().pipe(
            map((settings) => {
                if (!settings.pathfinding_service_address) {
                    this.pfsConfigured = false;
                    throw new Error('No PFS set!');
                }
                return settings.pathfinding_service_address;
            })
        );
        const tokenValueChange$: Observable<UserToken> =
            this.form.controls.token.valueChanges;
        const tokenNetworkAddress$ = tokenValueChange$.pipe(
            delay(0),
            filter((token) => !!token),
            tap(() => {
                this.loading = true;
                this.resetError();
            }),
            delay(0),
            switchMap((token) =>
                this.raidenService.getTokenNetworkAddress(token.address)
            )
        );

        const suggestions$ = combineLatest([
            pathfindingServiceUrl$,
            tokenNetworkAddress$,
        ]).pipe(
            switchMap(([pathfindingServiceUrl, tokenNetworkAddress]) =>
                this.http.get<SuggestedConnection[]>(
                    `${pathfindingServiceUrl}/api/v1/${tokenNetworkAddress}/suggest_partner`
                )
            )
        );
        const allChannels$ = this.channelPollingService.channels$.pipe(first());
        const existingChannels$ = combineLatest([
            tokenValueChange$,
            allChannels$,
        ]).pipe(
            map(([token, channels]) =>
                channels.filter(
                    (channel) =>
                        channel.state !== 'settled' &&
                        channel.token_address === token.address
                )
            )
        );

        zip(suggestions$, existingChannels$)
            .pipe(
                map(([suggestions, channels]) =>
                    suggestions.filter((suggestion) => {
                        const channelExisting = !!channels.find(
                            (channel) =>
                                channel.partner_address === suggestion.address
                        );
                        const isOwnAddress =
                            suggestion.address ===
                            this.raidenService.raidenAddress;
                        return !channelExisting && !isOwnAddress;
                    })
                ),
                catchError((error, caught) => {
                    this.loading = false;
                    this.showError();
                    if (!this.pfsConfigured) {
                        return EMPTY;
                    }
                    return caught;
                }),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((suggestions) => {
                this.loading = false;
                if (suggestions.length === 0) {
                    this.showError();
                }
                this.suggestions = suggestions;
            });
    }

    private subscribeToTokenUpdates() {
        this.form.controls.token.valueChanges
            .pipe(
                tap((token) => (this.tokenInput.selectedToken = token)),
                switchMap((token) =>
                    this.tokenPollingService.getTokenUpdates(
                        token?.address ?? ''
                    )
                ),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((updatedToken) => {
                this.tokenInput.maxAmount = updatedToken?.balance;
            });
    }

    private showError() {
        this.pfsError = true;
        this.form.controls.totalAmount.disable();
    }

    private resetError() {
        this.pfsError = false;
        this.form.controls.totalAmount.enable();
    }
}
