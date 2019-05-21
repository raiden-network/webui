import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'shortenAddress'
})
export class ShortenAddressPipe implements PipeTransform {

    transform(value?: string, width: number = 12): string {
        const separator = '...';
        if (!value) {
            return '';
        } else if (value.length <= width) {
            return value;
        } else {
            const substWidth = Math.floor(width / 2);
            return (
                value.substr(0, substWidth) +
                separator +
                value.substr(value.length - substWidth)
            );
        }
    }

}
