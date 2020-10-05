export type SignalSubscriber<T> = (data: T) => unknown;

export class Signal<T> {
	private subscribers = new Set<SignalSubscriber<T>>();

	subscribe(subscriber: SignalSubscriber<T>) {
		this.subscribers.add(subscriber);
		return this.unsubscribe.bind(this, subscriber);
	}

	unsubscribe(subscriber: SignalSubscriber<T>) {
		this.subscribers.delete(subscriber);
	}

	dispatch(data: T) {
		this.subscribers.forEach((subscriber) => subscriber(data));
	}
}
