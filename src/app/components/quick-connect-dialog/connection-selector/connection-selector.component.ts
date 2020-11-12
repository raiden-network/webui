import {
    AfterViewInit,
    Component,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    QueryList,
    SimpleChanges,
    ViewChildren,
} from '@angular/core';
import {
    AbstractControl,
    ControlContainer,
    FormArray,
    FormBuilder,
    FormControl,
    ValidatorFn,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { Animations } from 'app/animations/animations';
import { TokenInputComponent } from 'app/components/token-input/token-input.component';
import { SuggestedConnection } from 'app/models/connection';
import { RaidenService } from 'app/services/raiden.service';
import BigNumber from 'bignumber.js';
import { combineLatest, Observable, Subject } from 'rxjs';
import {
    auditTime,
    debounceTime,
    delay,
    distinctUntilChanged,
    filter,
    map,
    startWith,
    takeUntil,
} from 'rxjs/operators';

@Component({
    selector: 'app-connection-selector',
    templateUrl: './connection-selector.component.html',
    styleUrls: ['./connection-selector.component.scss'],
    animations: Animations.fallDown,
})
export class ConnectionSelectorComponent
    implements OnInit, OnChanges, OnDestroy, AfterViewInit {
    private static MAX_SUGGESTIONS = 3;

    @ViewChildren(TokenInputComponent)
    private tokenInputs: QueryList<TokenInputComponent>;

    @Input() private suggestions: SuggestedConnection[] = [];

    choicesForm: FormArray;
    explorerUrl$: Observable<string>;

    private ngUnsubscribe = new Subject();
    private unsubscribeFormChanges = new Subject();

    constructor(
        private fb: FormBuilder,
        private raidenService: RaidenService,
        private controlContainer: ControlContainer
    ) {}

    get tokenFormControl(): FormControl {
        return this.choicesForm.parent.get('token') as FormControl;
    }

    get totalAmountFormControl(): FormControl {
        return this.choicesForm.parent.get('totalAmount') as FormControl;
    }

    ngOnInit() {
        this.choicesForm = this.controlContainer.control as FormArray;
        this.choicesForm.setValidators([
            Validators.required,
            this.choicesValidator(),
        ]);
        const token$ = this.tokenFormControl.valueChanges.pipe(
            startWith(this.tokenFormControl.value)
        );
        this.explorerUrl$ = combineLatest([
            this.raidenService.network$,
            token$,
        ]).pipe(
            map(
                ([network, token]) =>
                    `${network.explorerUrl}/tokens/${token.address}`
            )
        );
    }

    ngAfterViewInit() {
        const token$ = this.tokenFormControl.valueChanges.pipe(
            startWith(this.tokenFormControl.value)
        );
        combineLatest([this.tokenInputs.changes, token$])
            .pipe(delay(0), takeUntil(this.ngUnsubscribe))
            .subscribe(([changedInput, token]) => {
                changedInput.forEach((tokenInput: TokenInputComponent) => {
                    tokenInput.selectedToken = token;
                });
            });

        const totalAmount$: Observable<BigNumber> = this.totalAmountFormControl.valueChanges.pipe(
            startWith(this.totalAmountFormControl.value)
        );
        combineLatest([this.tokenInputs.changes, totalAmount$])
            .pipe(delay(0), takeUntil(this.ngUnsubscribe))
            .subscribe(([changedInput, totalAmount]) => {
                changedInput.forEach((tokenInput: TokenInputComponent) => {
                    tokenInput.maxAmount = totalAmount;
                });
            });

        totalAmount$
            .pipe(
                filter(
                    (value) =>
                        BigNumber.isBigNumber(value) &&
                        !value.isNaN() &&
                        this.totalAmountFormControl.valid
                ),
                distinctUntilChanged((prev, curr) => prev.isEqualTo(curr)),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((totalAmount) => {
                this.patchFormForTotalAmount(totalAmount);
            });

        this.totalAmountFormControl.statusChanges
            .pipe(
                distinctUntilChanged(),
                filter((status) => status !== 'PENDING'),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe((status) => {
                if (status === 'VALID') {
                    this.choicesForm.enable({
                        onlySelf: true,
                        emitEvent: false,
                    });
                } else {
                    this.choicesForm.disable({
                        onlySelf: true,
                        emitEvent: false,
                    });
                }
            });

        setTimeout(() => this.updateForm());
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
        this.unsubscribeFormChanges.complete();
        this.choicesForm.clear();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!changes.suggestions) {
            return;
        }
        this.updateForm();
    }

    hasValue(value: BigNumber) {
        return (
            BigNumber.isBigNumber(value) &&
            !value.isNaN() &&
            value.isGreaterThan(0)
        );
    }

    splitEqually() {
        let controlsForDistribution: AbstractControl[];
        const controlsWithValue = this.choicesForm.controls.filter((control) =>
            this.hasValue(control.get('deposit').value)
        );
        if (controlsWithValue.length <= 1) {
            controlsForDistribution = this.choicesForm.controls;
        } else {
            controlsForDistribution = controlsWithValue;
        }

        const totalDeposit: BigNumber = this.totalAmountFormControl.value;
        const valuePerControl = totalDeposit.dividedToIntegerBy(
            controlsForDistribution.length
        );
        const remainder = totalDeposit.modulo(controlsForDistribution.length);
        controlsForDistribution.forEach((control, index) => {
            let newValue = valuePerControl;
            if (remainder.isGreaterThan(index)) {
                newValue = newValue.plus(1);
            }
            control.get('deposit').setValue(newValue, { emitEvent: false });
        });
        this.updatePercentages();
    }

    private percentageUpdated(
        changedControlIndex: number,
        newPercentage: number
    ) {
        const totalDeposit: BigNumber = this.totalAmountFormControl.value;
        const oldValue: BigNumber = this.choicesForm
            .at(changedControlIndex)
            .get('deposit').value;
        const newValue = totalDeposit
            .times(newPercentage)
            .integerValue(BigNumber.ROUND_CEIL);
        this.choicesForm
            .at(changedControlIndex)
            .get('deposit')
            .setValue(newValue, { emitEvent: false });
        this.updateDepositValues(changedControlIndex, newValue, oldValue);
    }

    private updateDepositValues(
        changedControlIndex: number,
        newValue: BigNumber,
        oldValue: BigNumber
    ) {
        const totalDeposit: BigNumber = this.totalAmountFormControl.value;

        const getOtherActiveControls = () =>
            this.choicesForm.controls.filter(
                (control, index) =>
                    this.hasValue(control.get('deposit').value) &&
                    index !== changedControlIndex
            );
        const getSumDeposits = (controls: AbstractControl[]) =>
            controls.reduce(
                (accumulator, control) =>
                    control.get('deposit').value.plus(accumulator),
                new BigNumber(0)
            ) as BigNumber;

        const distributeChange = (
            valueToDistribute: BigNumber,
            controls: AbstractControl[],
            add: boolean
        ) => {
            const valueChangePerControl = valueToDistribute.dividedToIntegerBy(
                controls.length
            );
            const remainder = valueToDistribute.modulo(controls.length);

            controls.forEach((control, index) => {
                const depositControl = control.get('deposit');
                const oldControlValue: BigNumber = depositControl.value;
                let valueChange = valueChangePerControl;
                if (remainder.isGreaterThan(index)) {
                    valueChange = valueChange.plus(1);
                }

                let newControlValue: BigNumber;
                if (add) {
                    newControlValue = oldControlValue.plus(valueChange);
                } else {
                    newControlValue = BigNumber.max(
                        oldControlValue.minus(valueChange),
                        0
                    );
                }
                depositControl.setValue(newControlValue, { emitEvent: false });
            });
        };

        let otherActiveControls = getOtherActiveControls();
        const sumOthers = getSumDeposits(otherActiveControls);
        const difference = newValue.minus(oldValue);
        let changeOthers: BigNumber;
        if (
            difference.isGreaterThan(0) &&
            newValue.plus(sumOthers).isLessThanOrEqualTo(totalDeposit)
        ) {
            changeOthers = new BigNumber(0);
        } else if (difference.isGreaterThan(0)) {
            changeOthers = BigNumber.min(difference, sumOthers);
        } else {
            changeOthers = difference.absoluteValue();
        }
        distributeChange(
            changeOthers,
            otherActiveControls,
            difference.isLessThan(0)
        );

        // There are some edge cases where we end up with more deposit in the
        // individual fields than the total deposit
        let sumAfterChanges = getSumDeposits(this.choicesForm.controls);
        while (sumAfterChanges.isGreaterThan(totalDeposit)) {
            const valueToReduce = sumAfterChanges.minus(totalDeposit);
            otherActiveControls = getOtherActiveControls();
            distributeChange(valueToReduce, otherActiveControls, false);

            sumAfterChanges = getSumDeposits(this.choicesForm.controls);
        }

        this.updatePercentages();
    }

    private updatePercentages() {
        const totalDeposit: BigNumber = this.totalAmountFormControl.value;
        this.choicesForm.controls.forEach((control) => {
            const percentage = Number(
                control.get('deposit').value.dividedBy(totalDeposit).toFixed(2)
            );
            control
                .get('percentage')
                .setValue(percentage, { emitEvent: false });
        });
    }

    private updateForm() {
        if (!this.choicesForm) {
            return;
        }

        this.unsubscribeFormChanges.next();
        this.choicesForm.clear();
        const visibleSuggestions: SuggestedConnection[] = this.suggestions.slice(
            0,
            ConnectionSelectorComponent.MAX_SUGGESTIONS
        );
        visibleSuggestions.forEach((suggestion, index) => {
            const formGroup = this.fb.group({
                partnerAddress: [suggestion.address, Validators.required],
                deposit: [undefined, Validators.required],
                percentage: 0,
            });

            this.choicesForm.push(formGroup);

            formGroup
                .get('percentage')
                .valueChanges.pipe(
                    auditTime(300),
                    takeUntil(this.ngUnsubscribe),
                    takeUntil(this.unsubscribeFormChanges)
                )
                .subscribe((newPercentage) =>
                    this.percentageUpdated(index, newPercentage)
                );
            formGroup
                .get('deposit')
                .valueChanges.pipe(
                    debounceTime(300),
                    filter(
                        (value) =>
                            BigNumber.isBigNumber(value) &&
                            !value.isNaN() &&
                            formGroup.get('deposit').valid
                    ),
                    distinctUntilChanged((prev, curr) => prev.isEqualTo(curr)),
                    takeUntil(this.ngUnsubscribe),
                    takeUntil(this.unsubscribeFormChanges)
                )
                .subscribe((newValue) => {
                    const totalDeposit: BigNumber = this.totalAmountFormControl
                        .value;
                    const oldValue = totalDeposit
                        .times(formGroup.get('percentage').value)
                        .integerValue();
                    this.updateDepositValues(index, newValue, oldValue);
                });
        });

        this.patchFormForTotalAmount(this.totalAmountFormControl.value);
        this.totalAmountFormControl.updateValueAndValidity();
    }

    private patchFormForTotalAmount(totalAmount: BigNumber) {
        this.choicesForm.controls.forEach((formGroup, index) => {
            let deposit: BigNumber;
            let percentage = 0;
            if (BigNumber.isBigNumber(totalAmount) && !totalAmount.isNaN()) {
                const isFirst = index === 0;
                deposit = isFirst ? totalAmount : new BigNumber(0);
                percentage = isFirst ? 1 : 0;
            }
            formGroup.patchValue({ deposit, percentage }, { emitEvent: false });
        });
    }

    private choicesValidator(): ValidatorFn {
        return (choicesForm: FormArray): ValidationErrors => {
            let allDepositsZero = true;
            for (let i = 0; i < choicesForm.controls.length; i++) {
                const depositControl = this.choicesForm.at(i).get('deposit');
                const error = depositControl.errors;
                if (error) {
                    return error;
                }

                allDepositsZero =
                    allDepositsZero && !this.hasValue(depositControl.value);
            }
            if (allDepositsZero) {
                return {
                    noSelection: true,
                };
            }

            return undefined;
        };
    }
}
