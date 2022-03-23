import React from 'react';
import { Label, InputGroup } from '@blueprintjs/core';
import { useDebouncedCallback } from 'use-debounce';

import { PubPageData, Pub, DocJson } from 'types';
import { MinimalEditor } from 'components';

type Props = {
	pub: Pub;
	abstract: null | DocJson;
	onUpdatePub: (pub: Partial<PubPageData>) => unknown;
	onUpdateAbstract: (abstract: DocJson) => Promise<unknown>;
};

const TitleDescriptionAbstract = (props: Props) => {
	const [onUpdatePubDebounced] = useDebouncedCallback(props.onUpdatePub, 250);
	return (
		<>
			<span className="info-text">
				The information you enter in this form and pub body below will be used to create a
				submission pub, which you can preview at any time before making your final
				submission.
			</span>
			<Label htmlFor="pub-title-input">
				<h2>Title of your submission pub</h2>
				<InputGroup
					className="submission-input"
					id="pub-title-input"
					onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
						onUpdatePubDebounced({ title: evt.target.value })
					}
					defaultValue={props.pub.title}
					placeholder="Enter pub title here..."
				/>
			</Label>
			<Label htmlFor="abstract-input">
				<h2>Abstract</h2>
				<MinimalEditor
					placeholder="Enter abstract here..."
					initialContent={props.abstract}
					onEdit={(doc) => props.onUpdateAbstract(doc.toJSON() as DocJson)}
					debounceEditsMs={300}
					getButtons={(buttons) => buttons.workflowButtonSet}
					useFormattingBar
					constrainHeight
				/>
			</Label>
			<Label>
				<h2>Description</h2>
				<InputGroup
					className="submission-input"
					placeholder="Enter description text here..."
					defaultValue={props.pub.description}
					onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
						onUpdatePubDebounced({ description: evt.target.value })
					}
				/>
			</Label>
			<Label>
				<h2>Pub Content</h2>
				<span className="input-prompt">
					Enter your primary submission content in the pub body below by typing or by
					importing files in which you already have content prepared.
				</span>
			</Label>
		</>
	);
};

export default TitleDescriptionAbstract;
