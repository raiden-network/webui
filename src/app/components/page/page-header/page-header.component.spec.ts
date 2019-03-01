import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PageHeaderComponent } from './page-header.component';
import { MaterialComponentsModule } from '../../../modules/material-components/material-components.module';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TestProviders } from '../../../../testing/test-providers';
import { MatDialog } from '@angular/material';
import { MockMatDialog } from '../../../../testing/mock-mat-dialog';
import Spy = jasmine.Spy;

describe('PageHeaderComponent', () => {
    let component: PageHeaderComponent;
    let fixture: ComponentFixture<PageHeaderComponent>;
    let dialog: MockMatDialog;

    let added: Spy;
    let cleared: Spy;
    let filtered: Spy;
    let sorted: Spy;
    let ordered: Spy;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PageHeaderComponent],
            providers: [
                TestProviders.MockMatDialog(),
                TestProviders.HammerJSProvider()
            ],
            imports: [
                MaterialComponentsModule,
                FormsModule,
                NoopAnimationsModule
            ]
        }).compileComponents();
        dialog = TestBed.get(MatDialog);
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PageHeaderComponent);
        component = fixture.componentInstance;

        added = spyOn(component.added, 'emit');
        cleared = spyOn(component.cleared, 'emit');
        filtered = spyOn(component.filtered, 'emit');
        sorted = spyOn(component.sorted, 'emit');
        ordered = spyOn(component.ordered, 'emit');

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit no events if the user cancels the filter dialog', function() {
        dialog.cancelled = true;
        component.openFilterDialog();
        expect(added).toHaveBeenCalledTimes(0);
        expect(cleared).toHaveBeenCalledTimes(0);
        expect(filtered).toHaveBeenCalledTimes(0);
        expect(sorted).toHaveBeenCalledTimes(0);
        expect(ordered).toHaveBeenCalledTimes(0);
    });

    it('should emit a clear event when dialog is closed with an empty keyword', function() {
        dialog.cancelled = false;
        dialog.returns = () => ({
            keyword: ''
        });

        component.openFilterDialog();

        expect(added).toHaveBeenCalledTimes(0);
        expect(cleared).toHaveBeenCalledTimes(1);
        expect(filtered).toHaveBeenCalledTimes(0);
        expect(sorted).toHaveBeenCalledTimes(0);
        expect(ordered).toHaveBeenCalledTimes(0);
    });

    it('should emit a filtered event when dialog is closed with a keyword', function() {
        dialog.cancelled = false;
        dialog.returns = () => ({
            keyword: 'RDN'
        });

        component.openFilterDialog();

        expect(added).toHaveBeenCalledTimes(0);
        expect(cleared).toHaveBeenCalledTimes(0);
        expect(filtered).toHaveBeenCalledTimes(1);
        expect(filtered).toHaveBeenCalledWith('RDN');
        expect(sorted).toHaveBeenCalledTimes(0);
        expect(ordered).toHaveBeenCalledTimes(0);

        expect(component.keyword).toBe('RDN');
    });

    it('should emit no events if sorting dialog is cancelled', function() {
        dialog.cancelled = true;
        component.openSortDialog();
        expect(added).toHaveBeenCalledTimes(0);
        expect(cleared).toHaveBeenCalledTimes(0);
        expect(filtered).toHaveBeenCalledTimes(0);
        expect(sorted).toHaveBeenCalledTimes(0);
        expect(ordered).toHaveBeenCalledTimes(0);
    });

    it('should emit a sort event if sorting changed in dialog', function() {
        dialog.cancelled = false;
        dialog.returns = () => ({
            sorting: 2,
            ascending: true
        });

        component.sorting = 1;
        component.ascending = true;

        component.openSortDialog();

        expect(added).toHaveBeenCalledTimes(0);
        expect(cleared).toHaveBeenCalledTimes(0);
        expect(filtered).toHaveBeenCalledTimes(0);
        expect(sorted).toHaveBeenCalledTimes(1);
        expect(sorted).toHaveBeenCalledWith(2);
        expect(ordered).toHaveBeenCalledTimes(0);

        expect(component.ascending).toBe(true);
        expect(component.sorting).toBe(2);
    });

    it('should emit an order event if order changed in dialog', function() {
        dialog.cancelled = false;
        dialog.returns = () => ({
            sorting: 1,
            ascending: false
        });

        component.sorting = 1;
        component.ascending = true;

        component.openSortDialog();

        expect(added).toHaveBeenCalledTimes(0);
        expect(cleared).toHaveBeenCalledTimes(0);
        expect(filtered).toHaveBeenCalledTimes(0);
        expect(sorted).toHaveBeenCalledTimes(0);
        expect(ordered).toHaveBeenCalledTimes(1);

        expect(component.ascending).toBe(false);
        expect(component.sorting).toBe(1);
    });

    it('should emit an added even when added is called', function() {
        component.add();
        expect(added).toHaveBeenCalledTimes(1);
        expect(cleared).toHaveBeenCalledTimes(0);
        expect(filtered).toHaveBeenCalledTimes(0);
        expect(sorted).toHaveBeenCalledTimes(0);
        expect(ordered).toHaveBeenCalledTimes(0);
    });
});
