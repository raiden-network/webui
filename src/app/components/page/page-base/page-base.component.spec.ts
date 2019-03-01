import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PageBaseComponent } from './page-base.component';
import { MaterialComponentsModule } from '../../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('PageBaseComponent', () => {
    let component: PageBaseComponent;
    let fixture: ComponentFixture<PageBaseComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [PageBaseComponent],
            imports: [MaterialComponentsModule, NoopAnimationsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PageBaseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
