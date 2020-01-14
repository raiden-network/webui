import { Component, OnInit, Input } from '@angular/core';
import { Channel } from '../../models/channel';
import { AddressBookService } from '../../services/address-book.service';

@Component({
    selector: 'app-channel',
    templateUrl: './channel.component.html',
    styleUrls: ['./channel.component.css']
})
export class ChannelComponent implements OnInit {
    @Input() channel: Channel;
    selected = false;

    constructor(private addressBookService: AddressBookService) {}

    ngOnInit() {}

    addressLabel(address: string): string | undefined {
        return this.addressBookService.get()[address];
    }
}
