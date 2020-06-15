import { Component, OnInit } from '@angular/core';
import { SelectedTokenService } from '../../services/selected-token.service';

@Component({
    selector: 'app-contacts-page',
    templateUrl: './contacts-page.component.html',
    styleUrls: ['./contacts-page.component.css'],
})
export class ContactsPageComponent implements OnInit {
    constructor(selectedTokenService: SelectedTokenService) {
        selectedTokenService.resetToken();
    }

    ngOnInit(): void {}
}
