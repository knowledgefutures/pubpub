import React from 'react';
import uuidv4 from 'uuid/v4';
import { Button } from '@blueprintjs/core';

import { pubUrl } from 'utils/canonicalUrls';
import { usePageContext } from 'utils/hooks';
import { Icon, ClickToCopyButton } from 'components';
import { FormattingBar, buttons } from 'components/FormattingBar';
import { setLocalHighlight, moveToEndOfSelection } from 'components/Editor';

import { usePubContext } from '../pubHooks';

require('./pubInlineMenu.scss');

const shouldOpenBelowSelection = () => {
	return ['Android', 'iPad', 'iPhone'].some((device) =>
		navigator.userAgent.toLowerCase().includes(device.toLowerCase()),
	);
};

const PubInlineMenu = () => {
	const { pubData, collabData, historyData } = usePubContext();
	const { communityData, scopeData } = usePageContext();
	const { canView, canCreateDiscussions } = scopeData.activePermissions;
	const selection = collabData.editorChangeObject.selection || {};
	const selectionBoundingBox = collabData.editorChangeObject.selectionBoundingBox || {};

	if (
		!collabData.editorChangeObject.selection ||
		selection.empty ||
		selection.$anchorCell ||
		collabData.editorChangeObject.selectedNode
	) {
		return null;
	}

	const topPosition =
		window.scrollY +
		(shouldOpenBelowSelection()
			? selectionBoundingBox.bottom + 10
			: selectionBoundingBox.top - 50);

	const renderFormattingBar = () => {
		if (pubData.isReadOnly) {
			return null;
		}
		return (
			<FormattingBar
				buttons={buttons.inlineMenuButtonSet}
				isTranslucent
				editorChangeObject={collabData.editorChangeObject}
				showBlockTypes={false}
				controlsConfiguration={{ kind: 'none' }}
			/>
		);
	};

	return (
		<div
			className="pub-inline-menu-component bp3-elevation-2"
			style={{ position: 'absolute', top: topPosition, left: selectionBoundingBox.left }}
		>
			{renderFormattingBar()}
			{(canView || canCreateDiscussions) && (
				<Button
					minimal={true}
					icon={<Icon icon="chat" />}
					onClick={() => {
						const view = collabData.editorChangeObject.view;
						setLocalHighlight(view, selection.from, selection.to, uuidv4());
						moveToEndOfSelection(collabData.editorChangeObject.view);
					}}
				/>
			)}
			<ClickToCopyButton
				className="click-to-copy"
				icon="clipboard"
				copyString={pubUrl(communityData, pubData, {
					isDraft: !pubData.isRelease,
					releaseNumber: pubData.releaseNumber,
					historyKey: historyData.currentKey,
					query: { from: selection.from, to: selection.to },
				})}
				beforeCopyPrompt="Copy a permalink"
			/>
		</div>
	);
};

export default PubInlineMenu;
