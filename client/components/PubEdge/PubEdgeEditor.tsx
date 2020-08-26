import React from 'react';
import { EditableText, TagInput } from '@blueprintjs/core';
import { Button as RKButton } from 'reakit/Button';

import { DatePicker } from 'components';

import { externalPublicationType } from './constants';
import { getHostnameForUrl } from './util';
import PubEdgeLayout from './PubEdgeLayout';
import PubEdgePlaceholderThumbnail from './PubEdgePlaceholderThumbnail';

require('./pubEdge.scss');

type Props = {
	externalPublication: externalPublicationType;
	onUpdateExternalPublication: (...args: any[]) => any;
};

const PubEdgeEditor = (props: Props) => {
	const {
		externalPublication: { title, description, contributors, avatar, url, publicationDate },
		onUpdateExternalPublication,
	} = props;

	const renderPublicationDate = () => {
		if (publicationDate) {
			return (
				<>
					Published on{' '}
					<DatePicker
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'small' does not exist on type 'Intrinsic... Remove this comment to see the full error message
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
			onUpdateExternalPublication({ publicationDate: new Date() });

		return (
			<RKButton
				as="a"
				// @ts-expect-error ts-migrate(2769) FIXME: Type 'string' is not assignable to type 'number | ... Remove this comment to see the full error message
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
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			className="pub-edge-editor-component"
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
			topLeftElement={
				avatar ? (
					<img src={avatar} alt="" />
				) : (
					<PubEdgePlaceholderThumbnail color="#ccc" external />
				)
			}
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
			titleElement={
				<EditableText
					placeholder="Add a title for this publication"
					multiline
					value={title}
					onChange={(value) => onUpdateExternalPublication({ title: value })}
				/>
			}
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
			bylineElement={
				<TagInput
					placeholder="Add authors for this publication"
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'ReactNode... Remove this comment to see the full error message
					values={contributors}
					onChange={(value) => onUpdateExternalPublication({ contributors: value })}
				/>
			}
			metadataElements={[
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
				renderPublicationDate(),
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
				<a href={url} alt={title}>
					{getHostnameForUrl(url)}
				</a>,
			]}
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
			detailsElement={
				<EditableText
					className="editable-details"
					placeholder="Add a description for this publication"
					multiline
					value={description}
					onChange={(value) => onUpdateExternalPublication({ description: value })}
				/>
			}
		/>
	);
};
export default PubEdgeEditor;
