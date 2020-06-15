import { Pipe, PipeTransform, NgModule } from '@angular/core';

@Pipe({
    name: 'chunk',
})
export class ChunkPipe implements PipeTransform {
    transform(value: Array<any>, size: number): any {
        return [].concat.apply(
            [],
            value.map((element: any, index: number) => {
                return index % size ? [] : [value.slice(index, index + size)];
            })
        );
    }
}
