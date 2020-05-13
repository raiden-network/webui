import { ChunkPipe } from './chunk.pipe';

describe('ChunkPipe', () => {
    let pipe: ChunkPipe;

    beforeEach(() => {
        pipe = new ChunkPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('transform an array into chunks', () => {
        const array = [1, 2, 3, 4, 5, 6, 7];
        const chunked = pipe.transform(array, 2);
        expect(chunked).toEqual([[1, 2], [3, 4], [5, 6], [7]]);
    });
});
