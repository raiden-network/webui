import { StatusPipe } from './status.pipe';

describe('StatusPipe', () => {
    let pipe: StatusPipe;
    beforeEach(() => {
        pipe = new StatusPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should capitalize the first letter of a word', function () {
        expect(pipe.transform('opened')).toBe('Opened');
    });

    it('should replace whitespace and only capitalize first letter', function () {
        expect(pipe.transform('waiting_for_settle')).toBe('Waiting for settle');
    });
});
