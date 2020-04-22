import { Plugin, PluginKey } from 'prosemirror-state';

export const domEventsPluginKey = new PluginKey('domEvents');

const createHandleDomEvents = (...eventNames) => {
	const eventsMap = {};
	eventNames.forEach((name) => {
		eventsMap[name] = (view, event) => {
			const trans = view.state.tr;
			trans.setMeta('latestDomEvent', event);
			view.dispatch(trans);
		};
	});
	return eventsMap;
};

export default () =>
	new Plugin({
		key: domEventsPluginKey,
		state: {
			init: () => {
				return { latestDomEvent: null };
			},
			apply: (transaction, { latestDomEvent }) => {
				return { latestDomEvent: transaction.getMeta('latestDomEvent') || latestDomEvent };
			},
		},
		props: {
			handleDOMEvents: createHandleDomEvents('click', 'keydown'),
		},
	});
