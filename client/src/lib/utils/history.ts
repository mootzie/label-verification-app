import { browser } from '$app/environment';

export function loadHist(key: string): string[] {
    if (!browser) return [];
    try {
        return JSON.parse(localStorage.getItem(key) ?? '[]');
    } catch {
        return [];
    }
}

export function saveHist(key: string, value: string) {
    if (!browser || !value.trim()) return;
    const h = loadHist(key);
    localStorage.setItem(
        key,
        JSON.stringify([value.trim(), ...h.filter((x) => x !== value.trim())].slice(0, 20))
    );
}
