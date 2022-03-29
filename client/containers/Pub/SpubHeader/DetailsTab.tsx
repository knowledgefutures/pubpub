import React from 'react';
import { Label, InputGroup } from '@blueprintjs/core';
import { useDebouncedCallback } from 'use-debounce';

import { PubPageData, Pub, DocJson } from 'types';
import { MinimalEditor, DownloadChooser } from 'components';

import SpubHeaderTab from './SpubHeaderTab';

type Props = {
	pub: Pub;
	abstract: null | DocJson;
	onUpdatePub: (pub: Partial<PubPageData>) => unknown;
	onUpdateAbstract: (abstract: DocJson) => Promise<unknown>;
};

const DetailsTab = (props: Props) => {
	const [onUpdatePubDebounced] = useDebouncedCallback(props.onUpdatePub, 250);
	return (
		<SpubHeaderTab>
			<div className="instruction">
				The information you enter in this form and the content section below will be used to
				create your submission. You can use the Preview tab to see how your submission will
				appear.
			</div>
			<Label>
				<h2>Submission Title</h2>
				<InputGroup
					onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
						onUpdatePubDebounced({ title: evt.target.value })
					}
					defaultValue={props.pub.title}
					placeholder="Type your submission's title here..."
				/>
			</Label>
			<h2>Abstract</h2>
			<MinimalEditor
				customNodes={{ doc: { content: 'paragraph' } }}
				placeholder="Type your submission's abstract here..."
				initialContent={props.abstract}
				onEdit={(doc) => props.onUpdateAbstract(doc.toJSON() as DocJson)}
				debounceEditsMs={300}
				useFormattingBar
				constrainHeight
			/>
			<Label>
				<h2>Default Download File</h2>
				<p className="instruction">
					You can upload a file, like a PDF with custom styling, to associate with this
					submission.
				</p>
				<DownloadChooser
					pubData={props.pub}
					communityId={props.pub.communityId}
					onSetDownloads={props.onUpdatePub}
					text="Upload new file"
				/>
			</Label>
		</SpubHeaderTab>
	);
};

export default DetailsTab;
