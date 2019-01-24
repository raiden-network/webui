import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
    MatAutocompleteModule,
    MatBadgeModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatPaginatorModule, MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatSortModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule
} from '@angular/material';

@NgModule({
    exports: [
        FlexLayoutModule,
        MatFormFieldModule,
        MatMenuModule,
        MatIconModule,
        MatButtonModule,
        MatPaginatorModule,
        MatCardModule,
        MatSelectModule,
        MatInputModule,
        MatListModule,
        MatTooltipModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        MatToolbarModule,
        MatAutocompleteModule,
        MatTableModule,
        MatRippleModule,
        MatSortModule,
        MatSidenavModule,
        MatBadgeModule,
        MatRadioModule,
        MatCheckboxModule
    ],
    imports: [
        CommonModule
    ],
    declarations: []
})
export class MaterialComponentsModule {
}
