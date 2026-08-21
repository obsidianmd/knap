/** Internal diagnostic hook. Intentionally silent in the library build. */
export function debugLog(_scope: string, ..._args: unknown[]): void {
	// Host applications own logging and error presentation.
}
