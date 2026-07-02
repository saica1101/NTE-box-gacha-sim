export function formatNumber(value: number): string {
    return new Intl.NumberFormat("ja-JP").format(value);
}

export function formatPercent(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
}

export function toInputNumber(value: number): string {
    return formatNumber(value);
}
