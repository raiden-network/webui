import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { ClipboardModule } from 'ngx-clipboard';
import { ToastrModule } from 'ngx-toastr';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { ChannelTableComponent } from './components/channel-table/channel-table.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { HomeComponent } from './components/home/home.component';
import { ConnectionManagerDialogComponent } from './components/connection-manager-dialog/connection-manager-dialog.component';
import { AboutComponent } from './components/about/about.component';
import { OpenDialogComponent } from './components/open-dialog/open-dialog.component';
import { PaymentDialogComponent } from './components/payment-dialog/payment-dialog.component';
import { RegisterDialogComponent } from './components/register-dialog/register-dialog.component';
import { TokenNetworkComponent } from './components/token-network/token-network.component';
import { MaterialComponentsModule } from './modules/material-components/material-components.module';
import { EllipsisPipe } from './pipes/ellipsis.pipe';
import { TokenPipe } from './pipes/token.pipe';
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
import { RegisteredNetworkValidatorDirective } from './directives/registered-network-validator.directive';
import { PaymentHistoryComponent } from './components/payment-history/payment-history.component';
import { AddressBookComponent } from './components/address-book/address-book.component';
import { LocalStorageAdapter } from './adapters/local-storage-adapter';
import { AddressBookItemComponent } from './components/address-book-item/address-book-item.component';
import { DragUploadDirective } from './directives/drag-upload.directive';
import { StatusPipe } from './pipes/status.pipe';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { ErrorComponent } from './components/error/error.component';
import { TokenNetworkActionsComponent } from './components/token-network-actions/token-network-actions.component';
import { FilterDialogComponent } from './components/page/dialogs/filter-dialog/filter-dialog.component';
import { SortDialogComponent } from './components/page/dialogs/sort-dialog/sort-dialog.component';
import {
    PageBaseComponent,
    PageHeaderDirective,
    PageItemDirective
} from './components/page/page-base/page-base.component';
import { PageItemComponent } from './components/page/page-item/page-item.component';
import { NavigationEntryComponent } from './components/navigation-entry/navigation-entry.component';
import { SortFilterPageHeaderComponent } from './components/page/sort-filter-page-header/sort-filter-page-header.component';
import { AddAddressDialogComponent } from './components/add-address-dialog/add-address-dialog.component';
import {
    ErrorStateMatcher,
    ShowOnDirtyErrorStateMatcher
} from '@angular/material/core';
import {
    MAT_DIALOG_DEFAULT_OPTIONS,
    MatDialogConfig
} from '@angular/material/dialog';
import { ShortenAddressPipe } from './pipes/shorten-address.pipe';
import { DisplayDecimalsPipe } from './pipes/display-decimals.pipe';
import { NotificationPanelComponent } from './components/notification/notification-panel/notification-panel.component';
import { NotificationItemComponent } from './components/notification/notification-item/notification-item.component';
import { NotificationService } from './services/notification.service';
import { RaidenToastComponent } from './components/notification/raiden-toast/raiden-toast.component';
import { ChannelComponent } from './components/channel/channel.component';
import { TokenComponent } from './components/token/token.component';
import { TokenCarouselComponent } from './components/token-carousel/token-carousel.component';
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

const appRoutes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'about', component: AboutComponent },
    { path: 'tokens', component: TokenNetworkComponent },
    { path: 'channels', component: ChannelTableComponent },
    { path: 'payments', component: PaymentHistoryComponent },
    { path: 'address-book', component: AddressBookComponent }
];

export function ConfigLoader(raidenConfig: RaidenConfig) {
    // Note: this factory need to return a function (that return a promise)
    return () => raidenConfig.load(environment.configFile);
}

@NgModule({
    declarations: [
        AppComponent,
        ChannelTableComponent,
        TokenNetworkComponent,
        HomeComponent,
        AboutComponent,
        PaymentDialogComponent,
        ConnectionManagerDialogComponent,
        RegisterDialogComponent,
        OpenDialogComponent,
        TokenPipe,
        EllipsisPipe,
        ConfirmationDialogComponent,
        DepositWithdrawDialogComponent,
        DecimalPipe,
        TokenInputComponent,
        AddressInputComponent,
        TokenNetworkSelectorComponent,
        RegisteredNetworkValidatorDirective,
        PaymentHistoryComponent,
        AddressBookComponent,
        AddressBookItemComponent,
        DragUploadDirective,
        StatusPipe,
        FileUploadComponent,
        ErrorComponent,
        TokenNetworkActionsComponent,
        SortFilterPageHeaderComponent,
        FilterDialogComponent,
        SortDialogComponent,
        PageBaseComponent,
        PageItemComponent,
        PageHeaderDirective,
        PageItemDirective,
        NavigationEntryComponent,
        AddAddressDialogComponent,
        ShortenAddressPipe,
        DisplayDecimalsPipe,
        NotificationPanelComponent,
        NotificationItemComponent,
        RaidenToastComponent,
        ChannelComponent,
        TokenComponent,
        TokenCarouselComponent,
        ChannelListComponent,
        StopClickPropagationDirective,
        ContactListComponent,
        ContactComponent,
        ContactActionsComponent,
        HistoryTableComponent,
        HeaderComponent,
        RaidenDialogComponent,
        AddEditContactDialogComponent
    ],
    imports: [
        RouterModule.forRoot(appRoutes),
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
            toastComponent: RaidenToastComponent
        }),
        ClipboardModule,
        RaidenIconsModule
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorHandlingInterceptor,
            deps: [NotificationService, RaidenService],
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: LosslessJsonInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TimeoutInterceptor,
            deps: [RaidenConfig],
            multi: true
        },
        RaidenConfig,
        {
            provide: APP_INITIALIZER,
            useFactory: ConfigLoader,
            deps: [RaidenConfig],
            multi: true
        },
        {
            provide: MAT_DIALOG_DEFAULT_OPTIONS,
            useValue: Object.assign(new MatDialogConfig(), <MatDialogConfig>{
                maxWidth: '90vw',
                width: '500px',
                autoFocus: false
            })
        },
        RaidenService,
        TokenPipe,
        LocalStorageAdapter,
        Web3Factory,
        {
            provide: ErrorStateMatcher,
            useClass: ShowOnDirtyErrorStateMatcher
        }
    ],
    entryComponents: [
        RegisterDialogComponent,
        ConnectionManagerDialogComponent,
        PaymentDialogComponent,
        ConfirmationDialogComponent,
        DepositWithdrawDialogComponent,
        OpenDialogComponent,
        FilterDialogComponent,
        SortDialogComponent,
        AddAddressDialogComponent,
        RaidenToastComponent,
        AddEditContactDialogComponent,
        ErrorComponent
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
