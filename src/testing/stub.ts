export function stub<T>(): T {
    const typeAssertion = <T>{};
    for (const prop in typeAssertion) {
        if (typeAssertion.hasOwnProperty(prop)) {
            typeAssertion[prop] = undefined;
        }
    }

    return typeAssertion;
}
