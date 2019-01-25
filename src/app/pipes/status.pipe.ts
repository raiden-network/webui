import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'status'
})
export class StatusPipe implements PipeTransform {
    transform(value: string): string {
        return value.replace(/^\w/, c => c.toUpperCase()).replace(/_/g, ' ');
    }
}
