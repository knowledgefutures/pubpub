import React, { useState } from 'react';
import { useBeforeUnload } from 'react-use';
import { Button } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { CustomScriptType } from 'utils/types';
import { usePageContext } from 'utils/hooks';

import { EditorComponentType } from './types';

require('./customScriptPanel.scss');

type Props = {
	EditorComponent: EditorComponentType;
	initialContent: null | string;
	language: string;
	label: string;
	type: CustomScriptType;
};

const persistScript = (communityId: string, type: CustomScriptType, content: string) =>
	apiFetch.post('/api/customScripts', { communityId, type, content });

const CustomScriptPanel = (props: Props) => {
	const { communityData } = usePageContext();
	const { EditorComponent, initialContent, language, label, type } = props;
	const [content, setContent] = useState(initialContent || '');
	const [persistedContent, setPersistedContent] = useState(content);
	const [isPersisting, setIsPersisting] = useState(false);
	const canPersistChanges = content !== persistedContent;

	useBeforeUnload(canPersistChanges);

	const handlePersist = async () => {
		setIsPersisting(true);
		await persistScript(communityData.id, type, content);
		setPersistedContent(content);
		setIsPersisting(false);
	};

	return (
		<div className="custom-script-panel-component">
			<Button
				outlined
				disabled={!canPersistChanges}
				onClick={handlePersist}
				intent="primary"
				className="save-changes-button"
			>
				{isPersisting ? `Saving...` : `Save ${label}`}
			</Button>
			<EditorComponent
				value={content}
				onChange={(v) => typeof v !== 'undefined' && setContent(v)}
				theme="vs-dark"
				defaultLanguage={language}
				options={{ minimap: { enabled: false } }}
			/>
		</div>
	);
};

export default CustomScriptPanel;
