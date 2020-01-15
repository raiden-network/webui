import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressBookItemComponent } from './address-book-item.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { Contact } from '../../models/contact';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher
} from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import {
    clickElement,
    errorMessage,
    mockInput
} from '../../../testing/interaction-helper';
import { ReactiveFormsModule } from '@angular/forms';
import { MockMatDialog } from '../../../testing/mock-mat-dialog';
import { TestProviders } from '../../../testing/test-providers';
import { SimpleChange } from '@angular/core';

describe('AddressBookItemComponent', () => {
    let component: AddressBookItemComponent;
    let fixture: ComponentFixture<AddressBookItemComponent>;
    let testContact: Contact;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                AddressBookItemComponent,
                ConfirmationDialogComponent
            ],
            imports: [
                MaterialComponentsModule,
                NoopAnimationsModule,
                ReactiveFormsModule
            ],
            providers: [
                TestProviders.MockMatDialog(),
                {
                    provide: ErrorStateMatcher,
                    useClass: ShowOnDirtyErrorStateMatcher
                }
            ]
        });
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddressBookItemComponent);
        component = fixture.componentInstance;
        testContact = {
            address: '0x504300C525CbE91Adb3FE0944Fe1f56f5162C75C',
            label: 'Test Node 1'
        };
        component.contact = testContact;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should change to edit mode when edit button is pressed', async(() => {
        const element = fixture.debugElement;

        const editButton = element.query(By.css('#edit-address'));
        expect(
            editButton.query(By.css('mat-icon')).nativeElement.innerText
        ).toBe('edit');

        const inputs = element.queryAll(By.css('input'));
        expect(inputs.length).toBe(2);
        expect((inputs[0].nativeElement as HTMLInputElement).disabled).toBe(
            true
        );
        expect((inputs[1].nativeElement as HTMLInputElement).disabled).toBe(
            true
        );

        const buttons = element.queryAll(By.css('button'));
        expect(buttons.length).toBe(2);

        expect(element.query(By.css('#delete-address'))).toBeTruthy();

        component.edit.subscribe(edit => {
            expect(edit).toBe(true);
        });

        const button = editButton.nativeElement as HTMLElement;
        button.click();

        fixture.detectChanges();

        expect(
            editButton.query(By.css('mat-icon')).nativeElement.innerText
        ).toBe('save');
        expect(element.query(By.css('#cancel-edit'))).toBeTruthy();
        expect(element.query(By.css('#delete-address'))).toBeFalsy();
    }));

    it('should emit a the contact when the user confirms the delete', async(() => {
        component.update.subscribe(address => {
            fail(`there should be no address emitted but got ${address}`);
        });

        component.edit.subscribe(editMode => {
            return fail(
                `There should be no change to edit mode but got ${editMode}`
            );
        });

        component.delete.subscribe(address => {
            expect(address).toBe(address);
        });

        clickElement(fixture.debugElement, '#delete-address');

        fixture.detectChanges();
    }));

    it('should emit the updated contact when user saves an edit', async(() => {
        const element = fixture.debugElement;

        component.delete.subscribe(address => {
            fail(`there should be no address emitted but got ${address}`);
        });

        component.update.subscribe(address => {
            expect(address.address).toBe(testContact.address);
            expect(address.label).toBe('TestNode 2');
        });

        clickElement(element, '#edit-address');
        fixture.detectChanges();

        mockInput(element, '#address-label', 'TestNode 2');

        const button = clickElement(element, '#edit-address');
        fixture.detectChanges();

        expect(button.disabled).toBe(false);
        expect(element.query(By.css('#cancel-edit'))).toBeFalsy();
        expect(element.query(By.css('#delete-address'))).toBeTruthy();
    }));

    it('should reset the edited value on cancel', async(() => {
        const element = fixture.debugElement;

        component.delete.subscribe(address => {
            fail(`There should be no address emitted but got ${address}`);
        });

        let sub = component.edit.subscribe(editMode => {
            expect(editMode).toBe(true);
        });

        component.cancelled.subscribe(cancelled => {
            expect(cancelled).toBe(true);
        });

        clickElement(element, '#edit-address');

        fixture.detectChanges();

        const input = mockInput(element, '#address-label', 'TestNode 2');

        sub.unsubscribe();
        sub = component.edit.subscribe(editMode => {
            expect(editMode).toBe(false);
        });

        clickElement(element, '#cancel-edit');
        fixture.detectChanges();

        expect(input.value).toBe('Test Node 1');
        sub.unsubscribe();
    }));

    it('should not emit a delete contact when the dialog cancel is pressed', async(() => {
        const element = fixture.debugElement;
        const dialog = TestBed.get(MatDialog) as MockMatDialog;
        dialog.cancelled = true;

        component.update.subscribe(address => {
            fail(`there should be no address emitted but got ${address}`);
        });

        component.edit.subscribe(editMode => {
            fail(`There should be no change to edit mode but got ${editMode}`);
        });

        component.delete.subscribe(address => {
            fail(`there should be no address emitted but got ${address}`);
        });

        clickElement(fixture.debugElement, '#delete-address');
        expect(element.query(By.css('#cancel-edit'))).toBeFalsy();
        expect(element.query(By.css('#delete-address'))).toBeTruthy();
    }));

    it('should show an error if during edit an empty label is inserted', async(() => {
        const element = fixture.debugElement;

        clickElement(element, '#edit-address');

        fixture.detectChanges();

        mockInput(element, '#address-label', '');
        component.form.get('label').markAsTouched();

        fixture.detectChanges();

        expect(errorMessage(element)).toBe('Label cannot be empty!');
    }));

    it('should update the label if the underlying address is modified', function() {
        const newContact: Contact = {
            address: component.contact.address,
            label: 'New Label'
        };

        component.ngOnChanges({
            address: new SimpleChange(component.contact, newContact, false)
        });

        fixture.detectChanges();

        expect(component.form.get('label').value).toBe('New Label');
    });

    it('should not show an error during edit without a user input', () => {
        const element = fixture.debugElement;
        clickElement(element, '#edit-address');
        fixture.detectChanges();
        expect(errorMessage(fixture.debugElement)).toBeFalsy();
    });

    it('should show errors during edit while the user types', () => {
        const element = fixture.debugElement;
        clickElement(element, '#edit-address');
        fixture.detectChanges();
        mockInput(element, '#address-label', '');
        fixture.detectChanges();
        expect(errorMessage(element)).toBe('Label cannot be empty!');
    });
});
