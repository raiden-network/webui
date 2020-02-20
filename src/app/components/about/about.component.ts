import { Component, OnInit, OnDestroy } from '@angular/core';
import { RaidenService } from '../../services/raiden.service';
import { version } from '../../../version';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit, OnDestroy {
    readonly webuiVersion = version;
    raidenVersion = '';
    networkName = '';

    private ngUnsubscribe = new Subject();

    constructor(private raidenService: RaidenService) {}

    ngOnInit() {
        this.raidenService
            .getVersion()
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(raidenVersion => (this.raidenVersion = raidenVersion));
        this.raidenService.network$
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(network => (this.networkName = network.name));
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    environmentInformation(): string {
        const environment = this.raidenService.production
            ? 'production'
            : 'development';
        return `## System\n- Raiden: v${this.raidenVersion}\n- WebUI: v${this.webuiVersion}\n- Environment: ${environment}\n- Network: ${this.networkName}\n- User agent: ${window.navigator.userAgent}`;
    }

    currentYear(): string {
        return new Date().getFullYear().toString();
    }
}
