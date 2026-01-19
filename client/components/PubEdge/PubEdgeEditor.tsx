import type { ExternalPublication } from 'types';

import React, { useEffect, useState } from 'react';

import { EditableText, InputGroup, TagInput } from '@blueprintjs/core';
import { Button as RKButton } from 'reakit/Button';

import { DatePicker } from 'components';
import { getHostnameForUrl } from 'utils/pubEdge';

import PubEdgeDescriptionButton from './PubEdgeDescriptionButton';
import PubEdgeLayout from './PubEdgeLayout';

import './pubEdge.scss';

export type PubEdgeEditorProps = {
	externalPublication: ExternalPublication;
	onUpdateExternalPublication: (patch: Partial<ExternalPublication>) => unknown;
	pubEdgeDescriptionIsVisible: boolean;
};

const PubEdgeEditor = (props: PubEdgeEditorProps) => {
	const {
		externalPublication: {
			title,
			description,
			contributors,
			avatar,
			url,
			publicationDate,
			doi,
		},
		pubEdgeDescriptionIsVisible,
		onUpdateExternalPublication,
	} = props;

	const [open, setOpen] = useState(pubEdgeDescriptionIsVisible);
	const [doiOpen, setDoiOpen] = useState(false);

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

	const renderDoiField = () => {
		if (doiOpen || doi) {
			return (
				<InputGroup
					placeholder="e.g., 10.1234/example"
					value={doi ?? ''}
					onChange={(e) => onUpdateExternalPublication({ doi: e.target.value || null })}
					small
					style={{ width: '200px', height: '24px' }}
					leftElement={
						<span
							style={{
								color: '#5c7080',
								height: '24px',
								display: 'flex',
								alignItems: 'center',
								padding: '0 4px',
							}}
						>
							DOI
						</span>
					}
				/>
			);
		}

		return (
			<RKButton
				as="a"
				// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
				tabIndex="0"
				onKeyDown={(evt) => evt.key === 'Enter' && setDoiOpen(true)}
				onClick={() => setDoiOpen(true)}
			>
				Add DOI
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
					placeholder="Add contributors to this publication"
					values={contributors ?? undefined}
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
				renderDoiField(),
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
						value={description ?? undefined}
						onChange={(value) => onUpdateExternalPublication({ description: value })}
					/>
				)
			}
		/>
	);
};
export default PubEdgeEditor;
