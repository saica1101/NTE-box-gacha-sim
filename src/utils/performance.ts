export function nextAnimationFrame(): Promise<void> {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            resolve();
        });
    });
}
