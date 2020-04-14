import { pipe, timer, UnaryFunction, Observable, EMPTY, merge } from 'rxjs';
import { retryWhen, switchMap, first } from 'rxjs/operators';

export function backoff(
    milliseconds: number,
    refreshObservable$?: Observable<void>
): UnaryFunction<Observable<any>, Observable<any>> {
    let refresh$: Observable<any> = refreshObservable$;
    if (!refreshObservable$) {
        refresh$ = EMPTY;
    }
    return pipe(
        retryWhen((errors) =>
            errors.pipe(
                switchMap(() =>
                    merge(timer(milliseconds), refresh$).pipe(first())
                )
            )
        )
    );
}
