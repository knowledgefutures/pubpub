import { useCallback, useEffect, useMemo, useState } from 'react';

import SuggestionManager, {
	SuggestionManagerStateSuggesting,
} from 'client/utils/suggestions/suggestionManager';

export const useSuggestions = <T>(enabled: boolean) => {
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

	return { suggesting: suggesting, suggestionManager: suggestionManager };
};
