import {
    createToken,
    createChannel,
    createAddress,
} from '../../testing/test-data';
import {
    matchesToken,
    matchesChannel,
    matchesContact,
} from './keyword-matcher';
import { Contact } from '../models/contact';

describe('KeywordMatcher', () => {
    it('should match a token', () => {
        const token = createToken({ symbol: 'RDN' });
        expect(matchesToken('RD', token)).toBe(true);
    });

    it('should not match a token for a non matching keyword', () => {
        const token = createToken({ name: 'Testing Token' });
        expect(matchesToken('Raiden', token)).toBe(false);
    });

    it('should match a channel', () => {
        const channel = createChannel();
        expect(
            matchesChannel(channel.partner_address.substring(0, 5), channel)
        ).toBe(true);
    });

    it('should not match a channel for a non matching keyword', () => {
        const channel = createChannel();
        expect(matchesChannel('My channel', channel)).toBe(false);
    });

    it('should match a channel with a token', () => {
        const channel = createChannel({
            userToken: createToken({ symbol: 'TST' }),
        });
        expect(matchesChannel('TST', channel)).toBe(true);
    });

    it('should match a contact', () => {
        const contact: Contact = {
            label: 'Test contact',
            address: createAddress(),
        };
        expect(matchesContact('contact', contact)).toBe(true);
    });

    it('should not match a contact for a non matching keyword', () => {
        const contact: Contact = {
            label: 'Test contact',
            address: createAddress(),
        };
        expect(matchesContact('Raiden', contact)).toBe(false);
    });
});
