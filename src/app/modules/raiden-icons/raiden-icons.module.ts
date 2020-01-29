import { NgModule } from '@angular/core';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

@NgModule({
    imports: [CommonModule, MatIconModule]
})
export class RaidenIconsModule {
    icon_names = [
        'copy',
        'qr',
        'notification',
        'search',
        'token',
        'channel',
        'go',
        'left',
        'right',
        'faucet',
        'transfer',
        'add',
        'eye',
        'thunderbolt',
        'received',
        'sent',
        'more',
        'info',
        'close'
    ];

    constructor(
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer
    ) {
        this.registerIcons();
    }

    private registerIcons() {
        this.icon_names.forEach(icon => {
            this.matIconRegistry.addSvgIcon(
                icon,
                this.domSanitizer.bypassSecurityTrustResourceUrl(
                    `assets/icons/${icon}.svg`
                )
            );
        });
    }
}
