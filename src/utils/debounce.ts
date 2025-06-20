export function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number = 500
): [T, () => void] {
    let timeout: ReturnType<typeof setTimeout>;

    const debounced = ((...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    }) as T;

    const cancel = () => clearTimeout(timeout);

    return [debounced, cancel];
}
