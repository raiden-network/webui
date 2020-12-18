export function storageMock(): Storage {
    let storage = {};

    return {
        setItem(key, value) {
            storage[key] = value || '';
        },
        getItem(key) {
            return key in storage ? storage[key] : null;
        },
        removeItem(key) {
            delete storage[key];
        },
        get length() {
            return Object.keys(storage).length;
        },
        key(i) {
            const keys = Object.keys(storage);
            return keys[i] || null;
        },
        clear(): void {
            storage = {};
        },
    };
}
