import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorComponent } from './error.component';
import { MatIconModule } from '@angular/material/icon';
import { Component, EventEmitter } from '@angular/core';
import { By } from '@angular/platform-browser';

@Component({
    template: `
        <app-error
            [errorTitle]="errorTitle"
            [errorDescription]="errorDescription"
            [buttonText]="buttonText"
            [showError]="showError"
            [errorContent]="errorContent"
            (buttonClicked)="buttonClicked.emit($event)"
        ></app-error>
    `
})
class TestHostComponent {
    errorTitle: string;
    errorDescription: string;
    buttonText: string;
    errorContent: string;
    showError = false;
    buttonClicked: EventEmitter<any> = new EventEmitter();
}

describe('ErrorComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    function getErrorComponentInstance() {
        const errorElement = fixture.debugElement.query(
            By.directive(ErrorComponent)
        );

        return errorElement.componentInstance;
    }

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ErrorComponent, TestHostComponent],
            imports: [MatIconModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show multiple lines for new line separated text', async function() {
        component.errorDescription = 'one\\ntwo\\nthree';
        fixture.detectChanges();
        await fixture.whenStable();
        const descriptionRows = getErrorComponentInstance().descriptionRows;
        expect(descriptionRows.length).toBe(3);
        expect(descriptionRows).toEqual(['one', 'two', 'three']);
    });

    it('should not display a show error button if no content available', async function() {
        component.buttonText = 'Test';
        fixture.detectChanges();
        await fixture.whenStable();
        const buttonElements = fixture.debugElement.queryAll(By.css('button'));
        expect(buttonElements.length).toBe(1);
        const button = buttonElements[0].nativeElement as HTMLButtonElement;
        expect(button.textContent.trim()).toEqual('TEST');
    });

    it('should emit an event when the button is clicked', async function(done) {
        component.buttonText = 'Test';
        fixture.detectChanges();
        await fixture.whenStable();

        component.buttonClicked.subscribe(value => {
            expect(value).toBe(true);
            done();
        });

        const element = fixture.debugElement.query(By.css('button'));
        const button = element.nativeElement as HTMLButtonElement;
        button.click();
    });

    it('should have the ability to display an error if there is a content', async function() {
        component.buttonText = 'Test';
        component.errorContent = 'Test text';
        fixture.detectChanges();
        await fixture.whenStable();

        const elements = fixture.debugElement.queryAll(By.css('button'));
        expect(elements.length).toBe(2);
        const button = elements[0].nativeElement as HTMLButtonElement;
        expect(button.innerText.trim()).toBe('SHOW ERROR');

        button.click();

        fixture.detectChanges();
        await fixture.whenStable();
        expect(button.innerText.trim()).toBe('HIDE ERROR');

        const contentArea = fixture.debugElement.query(
            By.css('.error-content')
        );
        expect(contentArea).toBeTruthy();
        const preElement = contentArea.query(By.css('pre'))
            .nativeElement as HTMLPreElement;
        expect(preElement.innerText.trim()).toBe('Test text');
    });
});
