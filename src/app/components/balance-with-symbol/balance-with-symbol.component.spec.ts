import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BalanceWithSymbolComponent } from './balance-with-symbol.component';
import { ClipboardModule } from 'ngx-clipboard';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DecimalPipe } from '../../pipes/decimal.pipe';
import { createToken } from '../../../testing/test-data';
import BigNumber from 'bignumber.js';
import { DisplayDecimalsPipe } from '../../pipes/display-decimals.pipe';

describe('BalanceWithSymbolComponent', () => {
    let component: BalanceWithSymbolComponent;
    let fixture: ComponentFixture<BalanceWithSymbolComponent>;

    const token = createToken({ decimals: 4, balance: new BigNumber(1000) });

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                BalanceWithSymbolComponent,
                DecimalPipe,
                DisplayDecimalsPipe,
            ],
            imports: [
                ClipboardModule,
                MaterialComponentsModule,
                NoopAnimationsModule,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BalanceWithSymbolComponent);
        component = fixture.componentInstance;

        component.token = token;
        component.balance = token.balance;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display a balance with token symbol', () => {
        expect(fixture.debugElement.nativeElement.innerText.trim()).toBe(
            `0.1 ${token.symbol}`
        );
    });
});
