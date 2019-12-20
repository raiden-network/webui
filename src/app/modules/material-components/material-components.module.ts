import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

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
        MatRippleModule,
        MatSortModule,
        MatSidenavModule,
        MatBadgeModule,
        MatCheckboxModule,
        MatExpansionModule
    ],
    imports: [CommonModule],
    declarations: []
})
export class MaterialComponentsModule {}
