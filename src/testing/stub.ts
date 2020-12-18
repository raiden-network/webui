export function stub<T>(): T {
    const typeAssertion = {} as T;
    for (const prop in typeAssertion) {
        if (typeAssertion.hasOwnProperty(prop)) {
            typeAssertion[prop] = undefined;
        }
    }

    return typeAssertion;
}
