import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UserToken } from '../../models/usertoken';

@Component({
    selector: 'app-token',
    templateUrl: './token.component.html',
    styleUrls: ['./token.component.css']
})
export class TokenComponent implements OnInit {
    @Input() token: UserToken;
    @Input() openChannels: number;
    @Input() position: number;
    @Input() allNetworksView = false;
    @Output() select: EventEmitter<boolean> = new EventEmitter();

    constructor() {}

    ngOnInit() {}
}
