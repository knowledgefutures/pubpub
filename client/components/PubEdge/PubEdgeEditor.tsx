import React, { useEffect, useState } from 'react';
import { EditableText, TagInput } from '@blueprintjs/core';
import { Button as RKButton } from 'reakit/Button';

import { DatePicker } from 'components';
import { getHostnameForUrl } from 'utils/pubEdge';
import { ExternalPublication } from 'types';

import PubEdgeLayout from './PubEdgeLayout';
import PubEdgeDescriptionButton from './PubEdgeDescriptionButton';

require('./pubEdge.scss');

export type PubEdgeEditorProps = {
	externalPublication: ExternalPublication;
	onUpdateExternalPublication: (patch: Partial<ExternalPublication>) => unknown;
	pubEdgeDescriptionIsVisible: boolean;
};

const PubEdgeEditor = (props: PubEdgeEditorProps) => {
	const {
		externalPublication: { title, description, contributors, avatar, url, publicationDate },
		pubEdgeDescriptionIsVisible,
		onUpdateExternalPublication,
	} = props;

	const [open, setOpen] = useState(pubEdgeDescriptionIsVisible);

	useEffect(() => setOpen(pubEdgeDescriptionIsVisible), [pubEdgeDescriptionIsVisible]);

	const renderPublicationDate = () => {
		if (publicationDate) {
			return (
				<>
					Published on{' '}
					<DatePicker
						// @ts-expect-error ts-migrate(2322) FIXME: Type '{ small: true; className: string; onSelectDa... Remove this comment to see the full error message
						small
						className="editable-date"
						onSelectDate={(date) =>
							onUpdateExternalPublication({ publicationDate: date })
						}
						date={publicationDate}
					/>
				</>
			);
		}

		const addPublicationDate = () =>
			onUpdateExternalPublication({ publicationDate: new Date().toISOString() });

		return (
			<RKButton
				as="a"
				// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
				tabIndex="0"
				onKeyDown={(evt) => evt.key === 'Enter' && addPublicationDate()}
				onClick={addPublicationDate}
			>
				Add publication date
			</RKButton>
		);
	};

	return (
		<PubEdgeLayout
			className="pub-edge-editor-component"
			topLeftElement={avatar && <img src={avatar} alt="" />}
			titleElement={
				<EditableText
					placeholder="Add a title for this publication"
					multiline
					value={title}
					onChange={(value) => onUpdateExternalPublication({ title: value })}
				/>
			}
			bylineElement={
				<TagInput
					placeholder="Add authors for this publication"
					values={contributors}
					onChange={(value) =>
						void onUpdateExternalPublication({ contributors: value as string[] })
					}
				/>
			}
			metadataElements={[
				<PubEdgeDescriptionButton
					onToggle={() => setOpen((value) => !value)}
					open={!!open}
					targetId=""
				/>,
				renderPublicationDate(),
				// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: string; href: string; alt: strin... Remove this comment to see the full error message
				<a href={url} alt={title}>
					{getHostnameForUrl(url)}
				</a>,
			]}
			detailsElement={
				open && (
					<EditableText
						className="editable-details"
						placeholder="Add a description for this publication"
						multiline
						value={description}
						onChange={(value) => onUpdateExternalPublication({ description: value })}
					/>
				)
			}
		/>
	);
};
export default PubEdgeEditor;
