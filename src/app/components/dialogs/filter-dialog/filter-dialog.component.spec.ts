import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterDialogComponent } from './filter-dialog.component';
import { MaterialComponentsModule } from '../../../modules/material-components/material-components.module';
import { FormsModule } from '@angular/forms';
import { TestProviders } from '../../../../testing/test-providers';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import Spy = jasmine.Spy;

describe('FilterDialogComponent', () => {
    let component: FilterDialogComponent;
    let fixture: ComponentFixture<FilterDialogComponent>;
    let closeSpy: Spy;

    beforeEach(async(() => {
        const spyObject = jasmine.createSpyObj('MatDialogRef', ['close']);
        closeSpy = spyObject.close;

        TestBed.configureTestingModule({
            declarations: [FilterDialogComponent],
            providers: [
                TestProviders.MockMatDialogRef(spyObject),
                TestProviders.MockMatDialogData({ keyword: '' }),
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
        fixture = TestBed.createComponent(FilterDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return an empty keyword when the user clears the filter', function() {
        component.clear();
        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy.calls.argsFor(0)[0]).toEqual({
            keyword: ''
        });
    });

    it('should return the keyword when the user applies the filter', function() {
        component.keyword = 'RDN';
        component.apply();
        expect(closeSpy).toHaveBeenCalledTimes(1);
        expect(closeSpy.calls.argsFor(0)[0]).toEqual({
            keyword: 'RDN'
        });
    });
});
