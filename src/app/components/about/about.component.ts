import { Component, OnInit, OnDestroy } from '@angular/core';
import { RaidenService } from '../../services/raiden.service';
import { version } from '../../../version';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit, OnDestroy {
    readonly webuiVersion = version;
    raidenVersion = '';
    networkName = '';

    private subscription: Subscription;

    constructor(private raidenService: RaidenService) {}

    ngOnInit() {
        this.raidenService
            .getVersion()
            .subscribe(raidenVersion => (this.raidenVersion = raidenVersion));
        this.subscription = this.raidenService.network$.subscribe(
            network => (this.networkName = network.name)
        );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    environmentInformation(): string {
        const environment = this.raidenService.production
            ? 'production'
            : 'development';
        return `## System\n- Raiden: v${this.raidenVersion}\n- WebUI: v${
            this.webuiVersion
        }\n- Environment: ${environment}\n- Network: ${
            this.networkName
        }\n- User agent: ${window.navigator.userAgent}`;
    }

    currentYear(): string {
        return new Date().getFullYear().toString();
    }
}
