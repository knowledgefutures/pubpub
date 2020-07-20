import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { EditableText, TagInput, InputGroup } from '@blueprintjs/core';
import { Button as RKButton } from 'reakit/Button';
import dateFormat from 'dateformat';

import { usePageContext } from 'utils/hooks';

import { externalPublicationType } from './constants';
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

	const [publicationDateString, setPublicationDateString] = useState(
		dateFormat(publicationDate, 'yyyy-mm-dd'),
	);

	useEffect(() => {
		if (publicationDate) {
			setPublicationDateString(dateFormat(publicationDate, 'yyyy-mm-dd'));
		}
	}, [publicationDate]);

	const handlePublicationDateChange = (evt) => {
		const nextDateString = evt.target.value;
		onUpdateExternalPublication({
			publicationDate: nextDateString ? new Date(nextDateString).toString() : null,
		});
	};

	const renderPublicationDate = () => {
		if (publicationDate) {
			return (
				<>
					Published on{' '}
					<InputGroup
						small
						className="editable-date"
						type="date"
						value={publicationDateString}
						onChange={handlePublicationDateChange}
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
					{url}
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
