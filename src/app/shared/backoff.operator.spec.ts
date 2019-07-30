import { backoff } from './backoff.operator';
import { of, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

describe('BackoffOperator', () => {
    let scheduler;

    function createRetriableStream(
        ...responses$: Array<Observable<any>>
    ): Observable<any> {
        const fetchNext = jasmine.createSpy('fetchNext');
        fetchNext.and.returnValues(...responses$);
        return of(null).pipe(switchMap(() => fetchNext()));
    }

    beforeEach(() => {
        scheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });
    });

    it('should retry after 100 ms have passed', function() {
        scheduler.run(helpers => {
            const { cold, expectObservable } = helpers;
            const source$ = createRetriableStream(
                cold('--a--#'),
                cold('--#'),
                cold('--b|')
            );
            const expectedMarbles = '--a 206ms b|';

            const result$ = source$.pipe(backoff(100));

            expectObservable(result$).toBe(expectedMarbles);
        });
    });

    it('should do nothing if no error occurs', function() {
        scheduler.run(helpers => {
            const { cold, expectObservable } = helpers;
            const source$ = cold('--a--b--c|');
            const expectedMarbles = '--a--b--c|';

            const result$ = source$.pipe(backoff(100));

            expectObservable(result$).toBe(expectedMarbles);
        });
    });
});
