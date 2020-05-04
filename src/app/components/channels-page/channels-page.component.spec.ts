import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelsPageComponent } from './channels-page.component';

describe('ChannelsPageComponent', () => {
    let component: ChannelsPageComponent;
    let fixture: ComponentFixture<ChannelsPageComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ChannelsPageComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ChannelsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
