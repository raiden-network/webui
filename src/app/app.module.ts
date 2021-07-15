import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { ClipboardModule } from 'ngx-clipboard';
import { ToastrModule, ToastContainerModule } from 'ngx-toastr';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { HomeComponent } from './components/home/home.component';
import { AboutComponent } from './components/about/about.component';
import { OpenDialogComponent } from './components/open-dialog/open-dialog.component';
import { PaymentDialogComponent } from './components/payment-dialog/payment-dialog.component';
import { RegisterDialogComponent } from './components/register-dialog/register-dialog.component';
import { MaterialComponentsModule } from './modules/material-components/material-components.module';
import { RaidenConfig, Web3Factory } from './services/raiden.config';
import { LosslessJsonInterceptor } from './interceptors/lossless-json.interceptor';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor';
import { ErrorHandlingInterceptor } from './interceptors/error-handling.interceptor';
import { RaidenService } from './services/raiden.service';
import { DepositWithdrawDialogComponent } from './components/deposit-withdraw-dialog/deposit-withdraw-dialog.component';
import { DecimalPipe } from './pipes/decimal.pipe';
import { TokenInputComponent } from './components/token-input/token-input.component';
import { AddressInputComponent } from './components/address-input/address-input.component';
import { TokenNetworkSelectorComponent } from './components/token-network-selector/token-network-selector.component';
import { LocalStorageAdapter } from './adapters/local-storage-adapter';
import { ErrorComponent } from './components/error/error.component';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher,
} from '@angular/material/core';
import {
    MAT_DIALOG_DEFAULT_OPTIONS,
    MatDialogConfig,
} from '@angular/material/dialog';
import { DisplayDecimalsPipe } from './pipes/display-decimals.pipe';
import { NotificationPanelComponent } from './components/notification/notification-panel/notification-panel.component';
import { NotificationItemComponent } from './components/notification/notification-item/notification-item.component';
import { NotificationService } from './services/notification.service';
import { RaidenToastComponent } from './components/notification/raiden-toast/raiden-toast.component';
import { ChannelComponent } from './components/channel/channel.component';
import { TokenComponent } from './components/token/token.component';
import { ChannelListComponent } from './components/channel-list/channel-list.component';
import { StopClickPropagationDirective } from './directives/stop-click-propagation.directive';
import { ContactListComponent } from './components/contact-list/contact-list.component';
import { ContactComponent } from './components/contact/contact.component';
import { ContactActionsComponent } from './components/contact/contact-actions/contact-actions.component';
import { HistoryTableComponent } from './components/history-table/history-table.component';
import { HeaderComponent } from './components/header/header.component';
import { RaidenDialogComponent } from './components/raiden-dialog/raiden-dialog.component';
import { AddEditContactDialogComponent } from './components/add-edit-contact-dialog/add-edit-contact-dialog.component';
import { RaidenIconsModule } from './modules/raiden-icons/raiden-icons.module';
import { QrCodeComponent } from './components/qr-code/qr-code.component';
import { SearchFieldComponent } from './components/search-field/search-field.component';
import { NavigationEntryComponent } from './components/navigation-entry/navigation-entry.component';
import { ChannelsPageComponent } from './components/channels-page/channels-page.component';
import { ContactsPageComponent } from './components/contacts-page/contacts-page.component';
import { TransfersPageComponent } from './components/transfers-page/transfers-page.component';
import { ChunkPipe } from './pipes/chunk.pipe';
import { SetHeadersInterceptor } from './interceptors/set-headers.interceptor';
import { BalanceWithSymbolComponent } from './components/balance-with-symbol/balance-with-symbol.component';
import { AddressIdenticonComponent } from './components/address-identicon/address-identicon.component';
import { PaymentIdentifierInputComponent } from './components/payment-identifier-input/payment-identifier-input.component';
import { QuickConnectDialogComponent } from './components/quick-connect-dialog/quick-connect-dialog.component';
import { ConnectionSelectorComponent } from './components/quick-connect-dialog/connection-selector/connection-selector.component';
import { UserDepositDialogComponent } from './components/user-deposit-dialog/user-deposit-dialog.component';
import { DepositWithdrawFormComponent } from './components/user-deposit-dialog/deposit-withdraw-form/deposit-withdraw-form.component';
import { ShortenAddressPipe } from './pipes/shorten-address.pipe';

const appRoutes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'channels', component: ChannelsPageComponent },
    { path: 'contacts', component: ContactsPageComponent },
    { path: 'transfers', component: TransfersPageComponent },
    { path: 'about', component: AboutComponent },
];

export function ConfigLoader(raidenConfig: RaidenConfig) {
    // Note: this factory need to return a function (that return a promise)
    return () => raidenConfig.load(environment.configFile);
}

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        AboutComponent,
        PaymentDialogComponent,
        RegisterDialogComponent,
        OpenDialogComponent,
        ConfirmationDialogComponent,
        DepositWithdrawDialogComponent,
        DecimalPipe,
        TokenInputComponent,
        AddressInputComponent,
        TokenNetworkSelectorComponent,
        ErrorComponent,
        DisplayDecimalsPipe,
        NotificationPanelComponent,
        NotificationItemComponent,
        RaidenToastComponent,
        ChannelComponent,
        TokenComponent,
        ChannelListComponent,
        StopClickPropagationDirective,
        ContactListComponent,
        ContactComponent,
        ContactActionsComponent,
        HistoryTableComponent,
        HeaderComponent,
        RaidenDialogComponent,
        AddEditContactDialogComponent,
        QrCodeComponent,
        SearchFieldComponent,
        NavigationEntryComponent,
        ChannelsPageComponent,
        ContactsPageComponent,
        TransfersPageComponent,
        ChunkPipe,
        BalanceWithSymbolComponent,
        AddressIdenticonComponent,
        PaymentIdentifierInputComponent,
        QuickConnectDialogComponent,
        ConnectionSelectorComponent,
        UserDepositDialogComponent,
        DepositWithdrawFormComponent,
        ShortenAddressPipe,
    ],
    imports: [
        RouterModule.forRoot(appRoutes, { relativeLinkResolution: 'legacy' }),
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        MaterialComponentsModule,
        ToastrModule.forRoot({
            timeOut: 5000,
            extendedTimeOut: 10000,
            preventDuplicates: false,
            toastComponent: RaidenToastComponent,
            positionClass: 'inline',
        }),
        ToastContainerModule,
        ClipboardModule,
        RaidenIconsModule,
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorHandlingInterceptor,
            deps: [NotificationService, RaidenService, RaidenConfig],
            multi: true,
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: LosslessJsonInterceptor,
            multi: true,
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TimeoutInterceptor,
            deps: [RaidenConfig],
            multi: true,
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: SetHeadersInterceptor,
            multi: true,
        },
        RaidenConfig,
        {
            provide: APP_INITIALIZER,
            useFactory: ConfigLoader,
            deps: [RaidenConfig],
            multi: true,
        },
        {
            provide: MAT_DIALOG_DEFAULT_OPTIONS,
            useValue: Object.assign(new MatDialogConfig(), {
                maxWidth: '90vw',
                width: '490px',
                autoFocus: false,
                backdropClass: 'dialog-backdrop',
            }),
        },
        RaidenService,
        LocalStorageAdapter,
        Web3Factory,
        {
            provide: ErrorStateMatcher,
            useClass: ShowOnDirtyErrorStateMatcher,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
