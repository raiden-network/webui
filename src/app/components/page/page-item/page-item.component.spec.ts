import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PageItemComponent } from './page-item.component';
import { MaterialComponentsModule } from '../../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('PageItemComponent', () => {
    let component: PageItemComponent;
    let fixture: ComponentFixture<PageItemComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PageItemComponent],
            imports: [MaterialComponentsModule, NoopAnimationsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PageItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
