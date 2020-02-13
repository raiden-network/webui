import { UserToken } from '../models/usertoken';
import { Contact } from '../models/contact';
import { Channel } from '../models/channel';

export function matchesToken(keyword: string, token: UserToken): boolean {
    const match = keyword.toLocaleLowerCase();
    const name = token.name.toLocaleLowerCase();
    const symbol = token.symbol.toLocaleLowerCase();
    const address = token.address.toLocaleLowerCase();
    return (
        name.indexOf(match) >= 0 ||
        symbol.indexOf(match) >= 0 ||
        address.indexOf(match) >= 0
    );
}

export function matchesChannel(keyword: string, channel: Channel): boolean {
    const match = keyword.toLocaleLowerCase();

    let matchingToken = false;
    if (channel.userToken) {
        matchingToken = matchesToken(keyword, channel.userToken);
    }

    const tokenAddress = channel.token_address.toLocaleLowerCase();
    const partnerAddress = channel.partner_address.toLocaleLowerCase();
    return (
        matchingToken ||
        tokenAddress.indexOf(match) >= 0 ||
        partnerAddress.indexOf(match) >= 0
    );
}

export function matchesContact(keyword: string, contact: Contact): boolean {
    const match = keyword.toLocaleLowerCase();
    const label = contact.label.toLocaleLowerCase();
    const address = contact.address.toLocaleLowerCase();
    return label.indexOf(match) >= 0 || address.indexOf(match) >= 0;
}
