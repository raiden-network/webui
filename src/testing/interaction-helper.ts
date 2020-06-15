import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { MatError } from '@angular/material/form-field';

export function mockEvent(
    type: string,
    eventInterface = 'Event',
    canBubble = false,
    cancellable = true
) {
    const event = document.createEvent(eventInterface);
    event.initEvent(type, canBubble, cancellable);
    return event;
}

export function clickElement(
    element: DebugElement,
    cssSelector: string
): HTMLButtonElement {
    const editButton = element.query(By.css(cssSelector));
    const button = editButton.nativeElement as HTMLButtonElement;
    button.click();
    return button;
}

export function mockInput(
    element: DebugElement,
    cssSelector: string,
    value: string
) {
    const inputElement = element.query(By.css(cssSelector));
    const input = inputElement.nativeElement as HTMLInputElement;
    input.focus();
    input.value = value;
    input.dispatchEvent(mockEvent('focusin'));
    input.dispatchEvent(mockEvent('input'));
}

export function mockOpenMatSelect(element: DebugElement) {
    const selector = element.query(By.css('.mat-select-trigger'))
        .nativeElement as HTMLElement;
    selector.focus();
    selector.click();
}

export function mockMatSelectFirst(element: DebugElement) {
    mockMatSelectByIndex(element, 0);
}

export function mockMatSelectByIndex(element: DebugElement, index: number) {
    const optionElements = element.queryAll(By.css('.mat-option'));
    const option = optionElements[index].nativeElement as HTMLElement;
    option.focus();
    option.click();
}
