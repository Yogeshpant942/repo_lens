/**
 * General helper utilities for RepoLens Backend
 * Author: Yogesh Pant (@Yogeshpant942)
 */

export function sanitizeString(input: string): string {
    return input.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
}

export function formatDurationMs(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}
