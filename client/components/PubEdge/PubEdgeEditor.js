import React from 'react';
import PropTypes from 'prop-types';
import { EditableText, TagInput } from '@blueprintjs/core';
import { Button as RKButton } from 'reakit/Button';

import { DatePicker } from 'components';

import { externalPublicationType } from './constants';
import { getHostnameForUrl } from './util';
import PubEdgeLayout from './PubEdgeLayout';
import PubEdgePlaceholderThumbnail from './PubEdgePlaceholderThumbnail';

require('./pubEdge.scss');

const propTypes = {
	externalPublication: externalPublicationType.isRequired,
	onUpdateExternalPublication: PropTypes.func.isRequired,
};

const PubEdgeEditor = (props) => {
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
			topLeftElement={
				avatar ? (
					<img src={avatar} alt="" />
				) : (
					<PubEdgePlaceholderThumbnail color="#ccc" external />
				)
			}
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
					onChange={(value) => onUpdateExternalPublication({ contributors: value })}
				/>
			}
			metadataElements={[
				renderPublicationDate(),
				<a href={url} alt={title}>
					{getHostnameForUrl(url)}
				</a>,
			]}
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

PubEdgeEditor.propTypes = propTypes;
export default PubEdgeEditor;
