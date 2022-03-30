import React from 'react';
import { InputGroup } from '@blueprintjs/core';
import { useDebouncedCallback } from 'use-debounce';

import { PubPageData, Pub, DocJson } from 'types';
import { MinimalEditor, DownloadChooser } from 'components';

import SpubHeaderTab from './SpubHeaderTab';
import SpubHeaderField from './SpubHeaderField';

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
			<SpubHeaderField title="Title" asLabel>
				<InputGroup
					onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
						onUpdatePubDebounced({ title: evt.target.value })
					}
					defaultValue={props.pub.title}
					fill
				/>
			</SpubHeaderField>
			<SpubHeaderField title="Abstract">
				<MinimalEditor
					customNodes={{ doc: { content: 'paragraph' } }}
					initialContent={props.abstract}
					onEdit={(doc) => props.onUpdateAbstract(doc.toJSON() as DocJson)}
					debounceEditsMs={300}
					useFormattingBar
					constrainHeight
					noMinHeight
				/>
			</SpubHeaderField>
			<SpubHeaderField
				title="Attached file"
				instructions={
					<>
						You can upload a file, like a PDF with custom styling, to associate with
						this submission.
					</>
				}
			>
				<DownloadChooser
					pubData={props.pub}
					communityId={props.pub.communityId}
					onSetDownloads={props.onUpdatePub}
					text="Upload new file"
				/>
			</SpubHeaderField>
		</SpubHeaderTab>
	);
};

export default DetailsTab;
