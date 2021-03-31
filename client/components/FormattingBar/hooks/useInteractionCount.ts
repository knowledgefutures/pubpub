import { useRef } from 'react';

export const useInteractionCount = (latestDomEvent: any) => {
	const key = useRef(-1);
	const previousDomEvent = useRef<any>(null);

	if (latestDomEvent) {
		const domEventsEqual =
			previousDomEvent.current &&
			previousDomEvent.current.type === latestDomEvent.type &&
			previousDomEvent.current.timeStamp === latestDomEvent.timeStamp;

		if (!domEventsEqual) {
			key.current += 1;
		}
		previousDomEvent.current = latestDomEvent;
	}

	return key.current;
};
