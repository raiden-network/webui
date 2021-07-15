import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortenAddress'
})
export class ShortenAddressPipe implements PipeTransform {
  transform(value?: string, width: number = 6): string {
      const separator = '...';
      if (!value) {
          return '';
      } else if (value.length <= width) {
          return value;
      } else {
          let prefix = '';
          if (value.startsWith('0x')) {
            prefix = '0x';
            value = value.substr(2);
          }
          const substWidth = Math.floor(width / 2);
          return (
              prefix +
              value.substr(0, substWidth) +
              separator +
              value.substr(value.length - substWidth)
          );
      }
  }
}
