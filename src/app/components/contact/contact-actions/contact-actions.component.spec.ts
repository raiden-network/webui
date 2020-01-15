import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactActionsComponent } from './contact-actions.component';

describe('ContactActionsComponent', () => {
    let component: ContactActionsComponent;
    let fixture: ComponentFixture<ContactActionsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ContactActionsComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ContactActionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
