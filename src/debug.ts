export type DebugLogger = (scope: string, ...args: unknown[]) => void;

let logger: DebugLogger | undefined;

/** Configure optional diagnostic logging for filters and rendering helpers. */
export function setDebugLogger(nextLogger?: DebugLogger): void {
	logger = nextLogger;
}

export function debugLog(scope: string, ...args: unknown[]): void {
	logger?.(scope, ...args);
}
