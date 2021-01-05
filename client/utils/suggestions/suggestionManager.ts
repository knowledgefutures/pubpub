import { SuggestCallbackParams } from 'prosemirror-suggest';
import { Signal } from '../signal';

const modFloor = (a: number, n: number) => ((a % n) + n) % n;

export enum SuggestionManagerStatus {
	Closed,
	Suggesting,
}

export type SuggestionManagerStateClosed = Readonly<{
	status: SuggestionManagerStatus.Closed;
}>;

export type SuggestionManagerStateSuggesting<T> = Readonly<{
	status: SuggestionManagerStatus.Suggesting;
	index: number;
	items: ReadonlyArray<T>;
	params: SuggestCallbackParams;
}>;

export type SuggestionManagerState<T> =
	| SuggestionManagerStateClosed
	| SuggestionManagerStateSuggesting<T>;

export type SuggestionManagerSuggesting<T> = SuggestionManager<T> & {
	state: SuggestionManagerStateSuggesting<T>;
};

export default class SuggestionManager<T> {
	private _state: SuggestionManagerState<T> = { status: SuggestionManagerStatus.Closed };

	get state() {
		return this._state;
	}

	readonly transitioned = new Signal<SuggestionManagerStatus>();

	load(items: T[], params: SuggestCallbackParams) {
		this._state = {
			status: SuggestionManagerStatus.Suggesting,
			index: this.isSuggesting() ? this.state.index : 0,
			items: items,
			params: params,
		};
		this.transitioned.dispatch(this._state.status);
	}

	next() {
		if (!this.isSuggesting()) {
			return;
		}

		const { state } = this;

		this._state = {
			...state,
			index: state.index + 1,
		};
	}

	previous() {
		if (!this.isSuggesting()) {
			return;
		}

		const { state } = this;

		this._state = {
			...state,
			index: state.index - 1,
		};
	}

	select(item?: T) {
		if (!this.isSuggesting()) {
			return;
		}

		const {
			items,
			params: { command },
		} = this.state;

		command(item !== undefined && items.includes(item) ? item : this.getSelectedValue());

		this.close();
	}

	close() {
		this._state = {
			status: SuggestionManagerStatus.Closed,
		};
		this.transitioned.dispatch(this._state.status);
	}

	isSuggesting(): this is SuggestionManagerSuggesting<T> {
		return this.state.status === SuggestionManagerStatus.Suggesting;
	}

	getSelectedValue(): T | null {
		if (this.isSuggesting()) {
			const { items, index } = this.state;
			return items[modFloor(index, items.length)];
		}

		return null;
	}

	getPosition() {
		if (!this.isSuggesting()) {
			return {
				position: 'absolute' as const,
				top: 0,
				left: 0,
			};
		}

		const { params } = this.state;
		const bounds = params.view.coordsAtPos(params.range.from + 1);
		const parent = document.body.getBoundingClientRect();

		return {
			position: 'absolute' as const,
			top: bounds.bottom - parent.top,
			left: bounds.left - parent.left,
		};
	}
}
