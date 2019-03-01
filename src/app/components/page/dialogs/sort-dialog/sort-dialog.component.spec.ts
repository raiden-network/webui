import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
    SortDialogComponent,
    SortDialogPayload
} from './sort-dialog.component';
import { MaterialComponentsModule } from '../../../../modules/material-components/material-components.module';
import { FormsModule } from '@angular/forms';
import { TestProviders } from '../../../../../testing/test-providers';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import Spy = jasmine.Spy;

describe('SortDialogComponent', () => {
    let component: SortDialogComponent;
    let fixture: ComponentFixture<SortDialogComponent>;
    let closeSpy: Spy;

    beforeEach(async(() => {
        const payload: SortDialogPayload = {
            ascending: true,
            sorting: 1,
            sortingOptions: [{ label: 'A', value: 1 }, { label: 'B', value: 2 }]
        };

        const spyObject = jasmine.createSpyObj('MatDialogRef', ['close']);
        closeSpy = spyObject.close;

        TestBed.configureTestingModule({
            declarations: [SortDialogComponent],
            providers: [
                TestProviders.MockMatDialogRef(spyObject),
                TestProviders.MockMatDialogData(payload),
                TestProviders.HammerJSProvider()
            ],
            imports: [
                MaterialComponentsModule,
                FormsModule,
                NoopAnimationsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SortDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize the state based on the payload', function() {
        expect(component.sorting).toBe(1);
        expect(component.ascending).toBe(true);
        expect(component.sortingOptions).toEqual([
            { label: 'A', value: 1 },
            { label: 'B', value: 2 }
        ]);
    });

    it('should return the changes when user closes the dialog', function() {
        expect(component.sorting).toBe(1);
        expect(component.ascending).toBe(true);
        component.order();
        expect(component.ascending).toBe(false);
        component.sort(2);
        expect(component.sorting).toBe(2);
        component.apply();
        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy.calls.argsFor(0)[0]).toEqual({
            ascending: false,
            sorting: 2,
            sortingOptions: undefined
        });
    });
});
