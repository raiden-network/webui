import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Channel } from '../../models/channel';
import { AddressBookService } from '../../services/address-book.service';
import { Animations } from '../../animations/animations';

@Component({
    selector: 'app-channel',
    templateUrl: './channel.component.html',
    styleUrls: ['./channel.component.css'],
    animations: Animations.flyInOut
})
export class ChannelComponent implements OnInit {
    @Input() channel: Channel;
    @Input() selected = false;
    @Output() select: EventEmitter<boolean> = new EventEmitter();

    constructor(private addressBookService: AddressBookService) {}

    ngOnInit() {}

    addressLabel(address: string): string | undefined {
        return this.addressBookService.get()[address];
    }
}
