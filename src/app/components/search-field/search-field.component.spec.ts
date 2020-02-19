import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchFieldComponent } from './search-field.component';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { TokenPipe } from '../../pipes/token.pipe';
import { TestProviders } from '../../../testing/test-providers';
import { SharedService } from '../../services/shared.service';
import { TokenPollingService } from '../../services/token-polling.service';
import { RaidenService } from '../../services/raiden.service';
import { SelectedTokenService } from '../../services/selected-token.service';
import {
    mockInput,
    clickElement,
    mockMatSelectFirst
} from '../../../testing/interaction-helper';
import { createToken, createTestContacts } from '../../../testing/test-data';
import { Contact } from '../../models/contact';
import { MatOption } from '@angular/material/core';
import { By } from '@angular/platform-browser';
import { AddressBookService } from '../../services/address-book.service';
import { stub } from '../../../testing/stub';
import { of } from 'rxjs';

describe('SearchFieldComponent', () => {
    let component: SearchFieldComponent;
    let fixture: ComponentFixture<SearchFieldComponent>;

    let sharedService: SharedService;
    let selectedTokenService: SelectedTokenService;
    const contacts: Contact[] = createTestContacts(1);
    const token = createToken();

    beforeEach(async(() => {
        const tokenPollingMock = stub<TokenPollingService>();
        // @ts-ignore
        tokenPollingMock.tokens$ = of([token]);

        TestBed.configureTestingModule({
            declarations: [SearchFieldComponent, TokenPipe],
            providers: [
                TestProviders.MockRaidenConfigProvider(),
                TestProviders.HammerJSProvider(),
                TestProviders.AddressBookStubProvider(),
                SharedService,
                { provide: TokenPollingService, useValue: tokenPollingMock },
                RaidenService,
                SelectedTokenService
            ],
            imports: [
                MaterialComponentsModule,
                HttpClientTestingModule,
                RaidenIconsModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchFieldComponent);
        component = fixture.componentInstance;

        sharedService = TestBed.inject(SharedService);
        selectedTokenService = TestBed.inject(SelectedTokenService);

        const raidenService = TestBed.inject(RaidenService);
        spyOn(raidenService, 'getUserToken').and.callFake(userToken => {
            return { [token.address]: token }[userToken];
        });
        const addressBookService = TestBed.inject(AddressBookService);
        addressBookService.getArray = () => contacts;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call shared service on input and reset token selection', () => {
        const searchSpy = spyOn(sharedService, 'setSearchValue');
        const selectionSpy = spyOn(selectedTokenService, 'setToken');
        mockInput(fixture.debugElement, 'input', 'TestToken');
        fixture.detectChanges();

        expect(searchSpy).toHaveBeenCalledTimes(1);
        expect(searchSpy).toHaveBeenCalledWith('TestToken');
        expect(selectionSpy).toHaveBeenCalledTimes(1);
        expect(selectionSpy).toHaveBeenCalledWith(undefined);
    });

    it('should set selected token if input is known token address', () => {
        const searchSpy = spyOn(sharedService, 'setSearchValue');
        const selectionSpy = spyOn(selectedTokenService, 'setToken');
        mockInput(fixture.debugElement, 'input', token.address);
        fixture.detectChanges();

        expect(searchSpy).toHaveBeenCalledTimes(1);
        expect(searchSpy).toHaveBeenCalledWith('');
        expect(selectionSpy).toHaveBeenCalledTimes(1);
        expect(selectionSpy).toHaveBeenCalledWith(token);
    });

    it('should be able to reset the search value', () => {
        mockInput(fixture.debugElement, 'input', token.address);
        fixture.detectChanges();

        const searchSpy = spyOn(sharedService, 'setSearchValue');
        const selectionSpy = spyOn(selectedTokenService, 'setToken');
        clickElement(fixture.debugElement, '#reset');
        fixture.detectChanges();

        expect(searchSpy).toHaveBeenCalledTimes(1);
        expect(searchSpy).toHaveBeenCalledWith('');
        expect(selectionSpy).toHaveBeenCalledTimes(0);
    });

    it('should show all autocomplete options with an empty input', () => {
        const input = fixture.debugElement.query(By.css('input')).nativeElement;
        input.focus();
        input.click();
        fixture.detectChanges();

        const options = fixture.debugElement.queryAll(By.directive(MatOption));
        expect(options.length).toBe(2);
    });

    it('should be able to select an autocomplete option', () => {
        const input = fixture.debugElement.query(By.css('input')).nativeElement;
        input.focus();
        input.click();
        fixture.detectChanges();

        const searchSpy = spyOn(sharedService, 'setSearchValue');
        const selectionSpy = spyOn(selectedTokenService, 'setToken');
        mockMatSelectFirst(fixture.debugElement);
        fixture.detectChanges();

        expect(input.value).toBe(token.address);
        expect(searchSpy).toHaveBeenCalledTimes(1);
        expect(searchSpy).toHaveBeenCalledWith('');
        expect(selectionSpy).toHaveBeenCalledTimes(1);
        expect(selectionSpy).toHaveBeenCalledWith(token);
    });
});
