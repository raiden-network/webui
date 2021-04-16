import { Component, OnInit, Input } from '@angular/core';
import { UserToken } from '../../models/usertoken';
import BigNumber from 'bignumber.js';

@Component({
    selector: 'app-balance-with-symbol',
    templateUrl: './balance-with-symbol.component.html',
    styleUrls: ['./balance-with-symbol.component.css'],
})
export class BalanceWithSymbolComponent implements OnInit {
    @Input() balance: BigNumber;
    @Input() token: UserToken;
    @Input() showTooltip = true;
    @Input() maxBalanceWidth = 50;

    constructor() {}

    ngOnInit(): void {}
}
