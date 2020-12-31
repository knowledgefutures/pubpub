import { useCallback, useEffect, useMemo, useState } from 'react';

import SuggestionManager, {
	SuggestionManagerStateSuggesting,
} from 'client/utils/suggestions/suggestionManager';

export const useSuggestions = <T>() => {
	const suggestionManager = useMemo(() => new SuggestionManager<T>(), []);
	const [suggesting, setSuggesting] = useState<null | SuggestionManagerStateSuggesting<T>>(null);

	const onSuggestionManagerTransition = useCallback(
		() => setSuggesting(suggestionManager.isSuggesting() ? suggestionManager.state : null),
		[suggestionManager],
	);

	useEffect(() => suggestionManager.transitioned.subscribe(onSuggestionManagerTransition), [
		suggestionManager,
		onSuggestionManagerTransition,
	]);

	return { suggesting: suggesting, suggestionManager: suggestionManager };
};
