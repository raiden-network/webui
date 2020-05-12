import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationEntryComponent } from './navigation-entry.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { RouterTestingModule } from '@angular/router/testing';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';

describe('NavigationEntryComponent', () => {
    let component: NavigationEntryComponent;
    let fixture: ComponentFixture<NavigationEntryComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NavigationEntryComponent],
            imports: [
                MaterialComponentsModule,
                RouterTestingModule,
                RaidenIconsModule,
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NavigationEntryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
