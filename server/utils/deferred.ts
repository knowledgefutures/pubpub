type Callback = () => unknown;
type DeferredTask = () => Promise<void>;

const createDeferredState = () => {
	let deferredCount = 0;
	let deferredCallbacks: Callback[] = [];

	const incrementCount = () => {
		deferredCount++;
	};

	const decrementCount = () => {
		deferredCount--;
		if (deferredCount === 0) {
			deferredCallbacks.forEach((cb) => cb());
			deferredCallbacks = [];
		}
	};

	const onDeferredTasksComplete = (callback: Callback) => {
		if (deferredCount === 0) {
			callback();
		} else {
			deferredCallbacks.push(callback);
		}
	};

	const finishDeferredTasks = (): Promise<void> => {
		return new Promise((resolve) => onDeferredTasksComplete(resolve));
	};

	const defer = (task: DeferredTask) => {
		incrementCount();
		task().then(decrementCount);
	};

	return { finishDeferredTasks, defer };
};

export const { defer, finishDeferredTasks } = createDeferredState();
