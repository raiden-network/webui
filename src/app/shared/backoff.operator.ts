import { pipe, timer, UnaryFunction, Observable } from 'rxjs';
import { retryWhen, switchMap } from 'rxjs/operators';

export function backoff(
    milliseconds: number
): UnaryFunction<Observable<any>, Observable<any>> {
    return pipe(
        retryWhen(errors => errors.pipe(switchMap(() => timer(milliseconds))))
    );
}
