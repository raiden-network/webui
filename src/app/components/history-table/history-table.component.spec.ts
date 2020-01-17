import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryTableComponent } from './history-table.component';

describe('HistoryTableComponent', () => {
    let component: HistoryTableComponent;
    let fixture: ComponentFixture<HistoryTableComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HistoryTableComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HistoryTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
