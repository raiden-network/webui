import { Component, OnInit } from '@angular/core';
import { SelectedTokenService } from '../../services/selected-token.service';

@Component({
    selector: 'app-channels-page',
    templateUrl: './channels-page.component.html',
    styleUrls: ['./channels-page.component.css'],
})
export class ChannelsPageComponent implements OnInit {
    constructor(selectedTokenService: SelectedTokenService) {
        selectedTokenService.resetToken();
    }

    ngOnInit(): void {}
}
