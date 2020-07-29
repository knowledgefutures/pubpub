import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { EditableText, TagInput, InputGroup } from '@blueprintjs/core';
import { Button as RKButton } from 'reakit/Button';

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

	const dateInputRef = useRef();

	useEffect(() => {
		const { current: dateInput } = dateInputRef;
		if (publicationDate && dateInput) {
			dateInput.valueAsDate = new Date(publicationDate);
		}
	}, [publicationDate]);

	const handlePublicationDateChange = (evt) => {
		const { valueAsDate, value } = evt.target;
		if (valueAsDate) {
			const nextPublicationDate = valueAsDate.toUTCString();
			onUpdateExternalPublication({ publicationDate: nextPublicationDate });
		} else {
			const nextPublicationDate = new Date(value);
			if (!Number.isNaN(nextPublicationDate.valueOf())) {
				onUpdateExternalPublication({ publicationDate: nextPublicationDate });
			}
		}
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
						inputRef={dateInputRef}
						onChange={handlePublicationDateChange}
						placeholder="YYYY-MM-DD"
					/>
				</>
			);
		}

		const addPublicationDate = () =>
			onUpdateExternalPublication({ publicationDate: new Date().toUTCString() });

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
