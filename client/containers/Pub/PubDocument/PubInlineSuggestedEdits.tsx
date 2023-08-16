import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { buttons, FormattingBarSuggestedEdits } from 'components/FormattingBar';
import { SuggestedEditsUser } from 'types';
import {
	acceptSuggestedEdits,
	getResolvableRangeForSelection,
} from 'client/components/Editor/plugins/suggestedEdits/resolve';
import { getSuggestionAttrsForNode } from 'client/components/Editor/plugins/suggestedEdits/operations';

import { apiFetch } from 'client/utils/apiFetch';

import { usePubContext } from '../pubHooks';

require('./pubInlineSuggestionMenu.scss');

const shouldOpenBelowSelection = () => {
	return ['Android', 'iPad', 'iPhone'].some((device) =>
		navigator.userAgent.toLowerCase().includes(device.toLowerCase()),
	);
};

const PubInlineSuggestedEdits = () => {
	const { collabData, pubBodyState } = usePubContext();

	const { editorChangeObject } = collabData;
	const selection = collabData.editorChangeObject?.selection;
	const [suggestionAuthor, setSuggestionAuthor] = useState<SuggestedEditsUser>();

	const shouldHide = useMemo(() => {
		if (!collabData.editorChangeObject || !collabData.editorChangeObject.view || !selection)
			return true;
		const state = collabData.editorChangeObject.view.state;
		const inRange = acceptSuggestedEdits(state);
		return !inRange || !selection;
	}, [collabData.editorChangeObject, selection]);

	const selectedSuggestion = useMemo(() => {
		if (editorChangeObject && editorChangeObject.view) {
			const doc = editorChangeObject.view.state.doc;
			const range = getResolvableRangeForSelection(editorChangeObject.view.state);
			if (range) {
				const node = doc.nodeAt(range.from);
				const attrs = node && getSuggestionAttrsForNode(node);
				return attrs;
			}
		}
		return null;
	}, [editorChangeObject]);

	const fetchSuggestedEditsUserInfo = useCallback(async () => {
		if (selectedSuggestion) {
			const suggestionUser: SuggestedEditsUser = await apiFetch.get(
				`/api/users?suggestionUserId=${encodeURIComponent(
					selectedSuggestion.suggestionUserId,
				)}`,
			);
			if (suggestionUser) {
				setSuggestionAuthor(suggestionUser);
			}
		}
	}, [selectedSuggestion]);

	useEffect(() => {
		fetchSuggestedEditsUserInfo();
	}, [fetchSuggestedEditsUserInfo]);

	// box around selection
	const selectionBoundingBox: Record<string, any> =
		collabData.editorChangeObject!.selectionBoundingBox || {};

	if (shouldHide) return null;

	const topPosition =
		window.scrollY +
		(shouldOpenBelowSelection()
			? selectionBoundingBox.bottom + 5
			: selectionBoundingBox.top - 30);

	const renderFormattingBar = () => {
		if (pubBodyState.isReadOnly) {
			return null;
		}
		return (
			<FormattingBarSuggestedEdits
				suggestionAuthor={suggestionAuthor}
				buttons={buttons.suggestedEditsButtonSet}
				editorChangeObject={editorChangeObject || ({} as any)}
			/>
		);
	};

	return (
		<div
			className="pub-inline-suggested-edit-menu-component"
			style={{ position: 'absolute', top: topPosition, left: selectionBoundingBox.left }}
		>
			{renderFormattingBar()}
		</div>
	);
};

export default PubInlineSuggestedEdits;
