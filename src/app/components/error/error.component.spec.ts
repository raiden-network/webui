import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorComponent, ErrorPayload } from './error.component';
import { By } from '@angular/platform-browser';
import { RaidenService } from '../../services/raiden.service';
import { TestProviders } from '../../../testing/test-providers';
import { ConnectionErrorType } from '../../models/connection-errors';
import { RaidenIconsModule } from '../../modules/raiden-icons/raiden-icons.module';
import { MaterialComponentsModule } from '../../modules/material-components/material-components.module';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { clickElement } from '../../../testing/interaction-helper';

describe('ErrorComponent', () => {
    let component: ErrorComponent;
    let fixture: ComponentFixture<ErrorComponent>;

    beforeEach(async(() => {
        const payload: ErrorPayload = {
            type: ConnectionErrorType.ApiError,
            errorContent: 'API error!'
        };

        TestBed.configureTestingModule({
            declarations: [ErrorComponent],
            providers: [
                TestProviders.MockMatDialogData(payload),
                RaidenService,
                TestProviders.MockRaidenConfigProvider()
            ],
            imports: [
                RaidenIconsModule,
                MaterialComponentsModule,
                HttpClientTestingModule
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ErrorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show an API error', () => {
        const title = fixture.debugElement.query(By.css('.title'));
        const description = fixture.debugElement.query(By.css('.description'));
        expect(title.nativeElement.innerText.trim()).toBe(
            'Raiden API connection error!'
        );
        expect(description.nativeElement.innerText.trim()).toBe(
            'A connection with the Raiden API could not be established. Please try again.'
        );
    });

    it('should show a RPC error', () => {
        const payload: ErrorPayload = {
            type: ConnectionErrorType.RpcError,
            errorContent: 'RPC error!'
        };
        component.data = payload;
        fixture.detectChanges();

        const title = fixture.debugElement.query(By.css('.title'));
        const description = fixture.debugElement.query(By.css('.description'));
        expect(title.nativeElement.innerText.trim()).toBe(
            'JSON RPC connection error!'
        );
        expect(description.nativeElement.innerText.trim()).toBe(
            'A connection with the Web3 provider could not be established. Please try again.'
        );
    });

    it('should attempt to connect to the API when retry button clicked', () => {
        const raidenService: RaidenService = TestBed.get(RaidenService);
        const attemptApiConnectionSpy = spyOn(
            raidenService,
            'attemptApiConnection'
        );
        clickElement(fixture.debugElement, '#retry');
        expect(attemptApiConnectionSpy).toHaveBeenCalledTimes(1);
    });

    it('should attempt to connect to the RPC when retry button clicked', () => {
        const payload: ErrorPayload = {
            type: ConnectionErrorType.RpcError,
            errorContent: 'RPC error!'
        };
        component.data = payload;
        fixture.detectChanges();

        const raidenService: RaidenService = TestBed.get(RaidenService);
        const attemptRpcConnectionSpy = spyOn(
            raidenService,
            'attemptRpcConnection'
        );
        clickElement(fixture.debugElement, '#retry');
        expect(attemptRpcConnectionSpy).toHaveBeenCalledTimes(1);
    });

    it('should not show the error content by default', () => {
        const content = fixture.debugElement.query(By.css('.content'));
        expect(content).toBeFalsy();
    });

    it('should show the error content when show error button clicked', () => {
        clickElement(fixture.debugElement, '#show_error');
        fixture.detectChanges();
        const content = fixture.debugElement.query(By.css('.content'));
        expect(content.nativeElement.innerText.trim()).toBe('API error!');
    });
});
