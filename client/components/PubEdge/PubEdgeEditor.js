import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { EditableText, TagInput, InputGroup } from '@blueprintjs/core';
import dateFormat from 'dateformat';

import { externalPublicationType } from './constants';
import PubEdgeLayout from './PubEdgeLayout';

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

	const handlePublicationDateChange = (evt) => {
		const nextDateString = evt.target.value;
		setPublicationDateString(nextDateString);
		onUpdateExternalPublication({ publicationDate: new Date(nextDateString).toString() });
	};

	return (
		<PubEdgeLayout
			className="pub-edge-editor-component"
			topLeftElement={<img src={avatar} alt="" />}
			titleElement={
				<EditableText
					placeholder="Add a title for this publication"
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
				<>
					Published on{' '}
					<InputGroup
						small
						className="editable-date"
						type="date"
						value={publicationDateString}
						onChange={handlePublicationDateChange}
					/>
				</>,
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
