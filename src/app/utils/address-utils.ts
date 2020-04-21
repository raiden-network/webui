import { checkAddressChecksum, isAddress, toChecksumAddress } from 'web3-utils';

export default class AddressUtils {
    static isDomain(address: string): boolean {
        return /\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b/.test(
            address
        );
    }

    static isChecksum(address: string): boolean {
        return isAddress(address) && checkAddressChecksum(address);
    }

    static isAddress(address: string): boolean {
        return isAddress(address);
    }

    static toChecksumAddress(address: string) {
        return toChecksumAddress(address);
    }
}
