import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenCarouselComponent } from './token-carousel.component';

describe('TokenCarouselComponent', () => {
    let component: TokenCarouselComponent;
    let fixture: ComponentFixture<TokenCarouselComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TokenCarouselComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TokenCarouselComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
