import { async, ComponentFixture, TestBed } from '@angular/core/testing';

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
});
