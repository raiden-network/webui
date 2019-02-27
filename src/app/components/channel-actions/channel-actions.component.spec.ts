import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelActionsComponent } from './channel-actions.component';

describe('ChannelActionsComponent', () => {
    let component: ChannelActionsComponent;
    let fixture: ComponentFixture<ChannelActionsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ChannelActionsComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChannelActionsComponent);
        component = fixture.componentInstance;
        component.channel = {
            channel_identifier: 1,
            balance: 1,
            partner_address: '',
            reveal_timeout: 100,
            settle_timeout: 500,
            state: '',
            token_address: '',
            total_deposit: 10,
            userToken: null
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
