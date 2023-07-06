import React from 'react';
import { Button, Callout, Classes } from '@blueprintjs/core';
import { EditorState, Transaction } from 'prosemirror-state';

import { PopoverButton } from 'components';
import { hasSuggestions } from 'client/utils/suggestedEdits';
import { pubData } from 'utils/storybook/data';
import { usePageContext } from 'utils/hooks';
import {
	acceptSuggestions,
	rejectSuggestions,
} from 'components/Editor/plugins/suggestedEdits/resolve';

import Download from './Download';
import { usePubContext } from '../pubHooks';
import SmallHeaderButton from './SmallHeaderButton';

const ConditionalWrapper = ({ condition, wrapper, children }) =>
	condition ? wrapper(children) : children;

const DowloadButton = () => {
	const { featureFlags } = usePageContext();
	const { collabData } = usePubContext();
	const { editorChangeObject } = collabData;

	const suggestedEditsAction = (action: {
		(state: EditorState, from: number, to: number): Transaction;
	}) => {
		if (!hasSuggestions(editorChangeObject)) return;
		if (!editorChangeObject) return;
		const editorState = editorChangeObject.view.state;
		const size = editorChangeObject.view.state.doc.nodeSize;
		const tr = action(editorState, 0, size - 2);
		editorChangeObject.view.dispatch(tr);
	};

	const handleSuggestedEditsAccept = () => {
		suggestedEditsAction(acceptSuggestions);
	};

	const handleSuggestedEditsReject = () => {
		suggestedEditsAction(rejectSuggestions);
	};

	const PopoverContent = () => {
		return (
			<React.Fragment>
				<Callout className="text-info" intent="warning">
					<p>
						You still have pending edits. Resolve your edits before downloading this
						Pub.
					</p>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button
							text="Reject All"
							intent="danger"
							onClick={handleSuggestedEditsReject}
						/>
						<Button
							text="Accept All"
							intent="success"
							onClick={handleSuggestedEditsAccept}
						/>
					</div>
				</Callout>
			</React.Fragment>
		);
	};
	return (
		<ConditionalWrapper
			condition={hasSuggestions(editorChangeObject) && featureFlags.suggestedEdits}
			wrapper={(children) => (
				<PopoverButton
					component={() => <PopoverContent />}
					className="pub-header-popover"
					aria-label="Download this Pub"
				>
					{children}
				</PopoverButton>
			)}
		>
			{hasSuggestions(editorChangeObject) && featureFlags.suggestedEdits ? (
				<SmallHeaderButton label="Download" labelPosition="left" icon="download2" />
			) : (
				<Download pubData={pubData}>
					<SmallHeaderButton label="Download" labelPosition="left" icon="download2" />
				</Download>
			)}
		</ConditionalWrapper>
	);
};

export default DowloadButton;
