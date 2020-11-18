import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
    ComponentFixture,
    fakeAsync,
    TestBed,
    tick,
} from '@angular/core/testing';
import {
    ControlContainer,
    FormArray,
    FormArrayName,
    FormControl,
    FormGroup,
    FormGroupDirective,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatSlider } from '@angular/material/slider';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TokenInputComponent } from 'app/components/token-input/token-input.component';
import { MaterialComponentsModule } from 'app/modules/material-components/material-components.module';
import { RaidenIconsModule } from 'app/modules/raiden-icons/raiden-icons.module';
import { RaidenConfig } from 'app/services/raiden.config';
import { amountToDecimal } from 'app/utils/amount.converter';
import BigNumber from 'bignumber.js';
import { ClipboardModule } from 'ngx-clipboard';
import { clickElement, mockInput } from 'testing/interaction-helper';
import { createSuggestedConnections, createToken } from 'testing/test-data';
import { TestProviders } from 'testing/test-providers';
import { ConnectionSelectorComponent } from './connection-selector.component';

describe('ConnectionSelectorComponent', () => {
    let component: ConnectionSelectorComponent;
    let fixture: ComponentFixture<ConnectionSelectorComponent>;

    let parentFormGroup: FormGroup;
    const token = createToken({
        decimals: 18,
        balance: new BigNumber('10000000000000000000'),
    });
    const totalAmount = new BigNumber('3000000000000000000');
    const suggestions = createSuggestedConnections();

    function initComponentForFakeAsync() {
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        tick(300);
        fixture.detectChanges();
    }

    beforeEach(async () => {
        parentFormGroup = new FormGroup({
            token: new FormControl(token, Validators.required),
            totalAmount: new FormControl(totalAmount, Validators.required),
            choices: new FormArray([], Validators.required),
        });
        const formGroupDirective: FormGroupDirective = new FormGroupDirective(
            [],
            []
        );
        formGroupDirective.form = parentFormGroup;
        const formArrayName = new FormArrayName(formGroupDirective, [], []);
        formArrayName.name = 'choices';

        await TestBed.configureTestingModule({
            declarations: [ConnectionSelectorComponent, TokenInputComponent],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.AddressBookStubProvider(),
                { provide: ControlContainer, useValue: formArrayName },
            ],
            imports: [
                MaterialComponentsModule,
                ReactiveFormsModule,
                NoopAnimationsModule,
                RaidenIconsModule,
                HttpClientTestingModule,
                ClipboardModule,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConnectionSelectorComponent);
        component = fixture.componentInstance;
        // @ts-ignore
        component.suggestions = suggestions;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should show the suggestions', fakeAsync(() => {
        initComponentForFakeAsync();

        const addressNodes = fixture.debugElement.queryAll(By.css('.address'));
        expect(addressNodes.length).toEqual(3);
        addressNodes.forEach((node, index) => {
            expect(node.nativeElement.innerText.trim()).toEqual(
                suggestions[index].address
            );
        });
    }));

    it('should set the url to the Raiden Explorer', fakeAsync(() => {
        initComponentForFakeAsync();

        const raidenConfig = TestBed.inject(RaidenConfig);
        raidenConfig.network$.subscribe((network) => {
            const graphLinks = fixture.debugElement.queryAll(
                By.css('.graph-button')
            );
            graphLinks.forEach((graphLink, index) => {
                expect(graphLink.attributes['href']).toEqual(
                    `${network.explorerUrl}/tokens/${token.address}?node=${suggestions[index].address}`
                );
            });
        });
    }));

    it('should set the deposit of the first suggestion to total by default', fakeAsync(() => {
        initComponentForFakeAsync();

        component.choicesForm.controls.forEach((control, index) => {
            const depositValue: BigNumber = control.get('deposit').value;
            if (index === 0) {
                expect(depositValue.isEqualTo(totalAmount)).toBe(true);
            } else {
                expect(depositValue.isEqualTo(0)).toBe(true);
            }
        });
    }));

    it('should update the other fields accordingly for new deposit value inputs', fakeAsync(() => {
        initComponentForFakeAsync();

        const tokenInputs = fixture.debugElement.queryAll(
            By.directive(TokenInputComponent)
        );
        const firstValue = new BigNumber('2000000000000000000');
        mockInput(
            tokenInputs[1],
            'input',
            amountToDecimal(firstValue, token.decimals).toString()
        );
        tick(300);
        fixture.detectChanges();

        component.choicesForm.controls.forEach((control, index) => {
            const depositValue: BigNumber = control.get('deposit').value;
            if (index === 0) {
                expect(
                    depositValue.isEqualTo(totalAmount.minus(firstValue))
                ).toBe(true);
            } else if (index === 1) {
                expect(depositValue.isEqualTo(firstValue)).toBe(true);
            } else {
                expect(depositValue.isEqualTo(0)).toBe(true);
            }
        });

        const secondValue = new BigNumber('1000000000000000001');
        const changeOtherControls = new BigNumber('500000000000000000');
        const remainder = new BigNumber('1');
        mockInput(
            tokenInputs[2],
            'input',
            amountToDecimal(secondValue, token.decimals).toString()
        );
        tick(300);
        fixture.detectChanges();

        component.choicesForm.controls.forEach((control, index) => {
            const depositValue: BigNumber = control.get('deposit').value;
            if (index === 0) {
                expect(
                    depositValue.isEqualTo(
                        totalAmount
                            .minus(firstValue)
                            .minus(changeOtherControls)
                            .minus(remainder)
                    )
                ).toBe(true);
            } else if (index === 1) {
                expect(
                    depositValue.isEqualTo(
                        firstValue.minus(changeOtherControls)
                    )
                ).toBe(true);
            } else {
                expect(depositValue.isEqualTo(secondValue)).toBe(true);
            }
        });
    }));

    it('should update the other fields accordingly when the slider is used', fakeAsync(() => {
        initComponentForFakeAsync();

        const tokenInputs = fixture.debugElement.queryAll(
            By.directive(TokenInputComponent)
        );
        const value = new BigNumber('1000000000000000000');
        mockInput(
            tokenInputs[1],
            'input',
            amountToDecimal(value, token.decimals).toString()
        );
        tick(300);
        fixture.detectChanges();

        const sliders = fixture.debugElement.queryAll(By.directive(MatSlider));
        (<MatSlider>sliders[2].componentInstance).input.emit({
            source: sliders[2].componentInstance,
            value: 1,
        });
        tick(300);
        fixture.detectChanges();

        component.choicesForm.controls.forEach((control, index) => {
            const depositValue: BigNumber = control.get('deposit').value;
            if (index === 2) {
                expect(depositValue.isEqualTo(totalAmount)).toBe(true);
            } else {
                expect(depositValue.isEqualTo(0)).toBe(true);
            }
        });
    }));

    it('should split the total amount equally when button is clicked', fakeAsync(() => {
        initComponentForFakeAsync();

        clickElement(fixture.debugElement, '#split-equally');

        const valuePerControl = totalAmount.dividedBy(3).integerValue();
        component.choicesForm.controls.forEach((control, index) => {
            const depositValue: BigNumber = control.get('deposit').value;
            expect(depositValue.isEqualTo(valuePerControl)).toBe(true);
        });
    }));

    it('should split the total amount equally among two controls if only two have a value', fakeAsync(() => {
        initComponentForFakeAsync();

        const tokenInputs = fixture.debugElement.queryAll(
            By.directive(TokenInputComponent)
        );
        const value = new BigNumber('1000000000000000000');
        mockInput(
            tokenInputs[1],
            'input',
            amountToDecimal(value, token.decimals).toString()
        );
        tick(300);
        fixture.detectChanges();

        clickElement(fixture.debugElement, '#split-equally');

        const valuePerControl = totalAmount.dividedBy(2).integerValue();
        component.choicesForm.controls.forEach((control, index) => {
            const depositValue: BigNumber = control.get('deposit').value;
            if (index === 2) {
                expect(depositValue.isEqualTo(0)).toBe(true);
            } else {
                expect(depositValue.isEqualTo(valuePerControl)).toBe(true);
            }
        });
    }));

    it('should disable the control if total amount is invalid', fakeAsync(() => {
        initComponentForFakeAsync();

        parentFormGroup.get('totalAmount').setValue('100invalid');
        parentFormGroup.get('totalAmount').setErrors({ notANumber: true });
        tick();

        expect(component.choicesForm.disabled).toBe(true);
    }));

    it('should reset the first deposit to total amount when total amount changes', fakeAsync(() => {
        initComponentForFakeAsync();

        const newTotal = new BigNumber('9999999999');
        parentFormGroup.get('totalAmount').setValue(newTotal);
        tick();

        component.choicesForm.controls.forEach((control, index) => {
            const depositValue: BigNumber = control.get('deposit').value;
            if (index === 0) {
                expect(depositValue.isEqualTo(newTotal)).toBe(true);
            } else {
                expect(depositValue.isEqualTo(0)).toBe(true);
            }
        });
    }));

    it('should show an error if one deposit has more than total amount', fakeAsync(() => {
        initComponentForFakeAsync();

        const tokenInputs = fixture.debugElement.queryAll(
            By.directive(TokenInputComponent)
        );
        const value = totalAmount.plus(1);
        mockInput(
            tokenInputs[0],
            'input',
            amountToDecimal(value, token.decimals).toString()
        );
        tick();
        fixture.detectChanges();
        tick(300);
        fixture.detectChanges();

        expect(component.choicesForm.errors).toEqual({
            insufficientFunds: true,
        });
    }));

    it('should show an error if all deposits are zero', fakeAsync(() => {
        initComponentForFakeAsync();

        const tokenInputs = fixture.debugElement.queryAll(
            By.directive(TokenInputComponent)
        );
        mockInput(tokenInputs[0], 'input', '0');
        tick();
        fixture.detectChanges();
        tick(300);
        fixture.detectChanges();

        expect(component.choicesForm.errors).toEqual({ noSelection: true });
    }));
});
