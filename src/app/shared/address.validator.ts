import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import AddressUtils from '../utils/address-utils';

export function addressValidator(): ValidatorFn {
    const regex = new RegExp('^0x[0-9a-fA-F]{40}$');
    return (control: AbstractControl): { [key: string]: any } | null => {
        const value = control.value;
        if (!value) {
            return { emptyAddress: true };
        } else if (!regex.test(value)) {
            return { invalidFormat: true };
        } else {
            return null;
        }
    };
}

export function isAddressValid(
    address?: string,
    ownAddress?: string
): ValidationErrors | undefined {
    if (!address) {
        return { emptyAddress: true };
    }
    if (address === ownAddress) {
        return { ownAddress: true };
    }
    if (!address || !AddressUtils.isAddress(address)) {
        return { invalidFormat: true };
    }
    if (address && address.length === 42 && !AddressUtils.isChecksum(address)) {
        return { notChecksumAddress: true };
    }
    return undefined;
}
