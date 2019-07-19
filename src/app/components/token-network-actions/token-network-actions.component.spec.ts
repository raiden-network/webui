import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TokenNetworkActionsComponent } from './token-network-actions.component';

describe('TokenNetworkActionsComponent', () => {
    let component: TokenNetworkActionsComponent;
    let fixture: ComponentFixture<TokenNetworkActionsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TokenNetworkActionsComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TokenNetworkActionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have a mint token button when network is not mainnet', () => {
        component.onMainnet = false;
        fixture.detectChanges();
        const element = fixture.debugElement.query(By.css('#token-mint'));
        expect(element).toBeTruthy();
    });

    it('should not have a mint token button when network is mainnet', () => {
        component.onMainnet = true;
        fixture.detectChanges();
        const element = fixture.debugElement.query(By.css('#token-mint'));
        expect(element).toBeFalsy();
    });

    it('should disable mint button while requesting', () => {
        component.requestingTokens = true;
        fixture.detectChanges();
        const element = fixture.debugElement.query(By.css('#token-mint'));
        expect(element.nativeElement.disabled).toBeTruthy();
    });
});
