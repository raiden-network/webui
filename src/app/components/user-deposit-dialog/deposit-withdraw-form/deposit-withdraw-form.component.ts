import {
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
    ConfirmationDialogComponent,
    ConfirmationDialogPayload,
} from 'app/components/confirmation-dialog/confirmation-dialog.component';
import { TokenInputComponent } from 'app/components/token-input/token-input.component';
import { DepositMode } from 'app/models/deposit-mode.enum';
import { UserDepositService } from 'app/services/user-deposit.service';
import BigNumber from 'bignumber.js';
import { Observable, of, Subject } from 'rxjs';
import { first, map, switchMap, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-deposit-withdraw-form',
    templateUrl: './deposit-withdraw-form.component.html',
    styleUrls: ['./deposit-withdraw-form.component.scss'],
})
export class DepositWithdrawFormComponent implements OnInit, OnDestroy {
    @Input() inputMode: DepositMode;
    @Output() accept: EventEmitter<BigNumber> = new EventEmitter();
    @Output() cancel: EventEmitter<boolean> = new EventEmitter();

    @ViewChild(TokenInputComponent, { static: true })
    private tokenInput: TokenInputComponent;

    form: FormGroup;

    private ngUnsubscribe = new Subject();

    constructor(
        private fb: FormBuilder,
        private userDepositService: UserDepositService,
        private dialog: MatDialog
    ) {
        this.form = this.fb.group({
            amount: ['', Validators.required],
        });
    }

    get depositing(): boolean {
        return this.inputMode === DepositMode.DEPOSIT;
    }

    ngOnInit(): void {
        this.userDepositService.servicesToken$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((servicesToken) => {
                this.tokenInput.selectedToken = servicesToken;
            });

        let maxAmount$: Observable<BigNumber>;
        if (this.depositing) {
            maxAmount$ = this.userDepositService.servicesToken$.pipe(
                map((token) => token.balance)
            );
        } else {
            maxAmount$ = this.userDepositService.balance$;
        }

        maxAmount$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((maxAmount) => {
                this.tokenInput.maxAmount = maxAmount;
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    submit() {
        let canSubmit$: Observable<boolean>;
        if (this.depositing) {
            canSubmit$ = of(true);
        } else {
            canSubmit$ = this.userDepositService.withdrawPlan$.pipe(
                first(),
                switchMap((withdrawPlan) => {
                    if (withdrawPlan.amount.isZero()) {
                        return of(true);
                    }
                    const confirmationPayload: ConfirmationDialogPayload = {
                        title: 'Override Planned Withdrawal',
                        message:
                            'There is already a withdrawal planned. This will override the existing plan. Are you sure?',
                    };
                    const dialog = this.dialog.open(
                        ConfirmationDialogComponent,
                        {
                            data: confirmationPayload,
                        }
                    );
                    return dialog.afterClosed();
                })
            );
        }

        canSubmit$.subscribe((result) => {
            if (result) {
                this.accept.emit(this.form.value.amount);
            }
        });
    }

    onEnter(event: Event) {
        console.log(event);
        event.stopPropagation();
        if (this.form.invalid) {
            return;
        }
        this.submit();
    }
}
