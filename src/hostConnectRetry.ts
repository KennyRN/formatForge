/**
 * Soft-connect retry for optional Forge hosts that may finish loading after us.
 * Shared by storyForge and timelineForge companion registration.
 */
export function softConnectWithRetry(
	tryConnect: () => boolean,
	opts: {
		registerInterval: (id: number) => number;
		onLayoutChange: (cb: () => void) => void;
		maxAttempts?: number;
		intervalMs?: number;
		setIntervalFn?: typeof setInterval;
		clearIntervalFn?: typeof clearInterval;
	},
): void {
	if (tryConnect()) return;

	const maxAttempts = opts.maxAttempts ?? 120;
	const intervalMs = opts.intervalMs ?? 500;
	const setIntervalFn = opts.setIntervalFn ?? window.setInterval.bind(window);
	const clearIntervalFn = opts.clearIntervalFn ?? window.clearInterval.bind(window);

	let attempts = 0;
	const handle = setIntervalFn(() => {
		attempts += 1;
		if (tryConnect() || attempts >= maxAttempts) {
			clearIntervalFn(handle);
		}
	}, intervalMs);
	opts.registerInterval(handle as unknown as number);

	opts.onLayoutChange(() => {
		tryConnect();
	});
}
