import { useCallback, useEffect, useMemo, useState } from 'react';

import SuggestionManager, {
	SuggestionManagerStateSuggesting,
} from 'client/utils/suggestions/suggestionManager';

export const useSuggestions = <T>(enabled: boolean) => {
	// This lint rule thinks T is a _value_ that's a dependency of the useEffect hook...
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const suggestionManager = useMemo(() => new SuggestionManager<T>(), []);
	const [suggesting, setSuggesting] = useState<null | SuggestionManagerStateSuggesting<T>>(null);

	const onSuggestionManagerTransition = useCallback(
		() => setSuggesting(suggestionManager.isSuggesting() ? suggestionManager.state : null),
		[suggestionManager],
	);

	useEffect(() => {
		if (enabled) {
			suggestionManager.transitioned.subscribe(onSuggestionManagerTransition);
			return () => suggestionManager.transitioned.unsubscribe(onSuggestionManagerTransition);
		}
		return () => {};
	}, [suggestionManager, onSuggestionManagerTransition, enabled]);

	return { suggesting, suggestionManager };
};
