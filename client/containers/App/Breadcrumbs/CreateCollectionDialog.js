import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Callout, Card, ControlGroup, Overlay, InputGroup } from '@blueprintjs/core';
import { RadioGroup, Radio, useRadioState } from 'reakit/Radio';

import { Icon } from 'components';
import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { getSchemaForKind } from 'utils/collections/schemas';
import { apiFetch } from 'client/utils/apiFetch';

require('./createCollectionDialog.scss');

const propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
};

const kinds = [
	{
		key: 'tag',
		description: 'A lightweight collection of thematically related pubs',
	},
	{
		key: 'issue',
		description: 'Organize your pubs into an issue of your journal',
	},
	{
		key: 'book',
		description: 'Arrange pubs into chapters for a longer texts',
	},
	{
		key: 'conference',
		description: 'Host a conference on PubPub',
	},
];

const CreateCollectionDialog = (props) => {
	const { isOpen, onClose } = props;
	const { communityData } = usePageContext();
	const [isCreating, setIsCreating] = useState(false);
	const [creatingError, setCreatingError] = useState(null);
	const [title, setTitle] = useState('');
	const kindRadio = useRadioState({ state: 'tag' });

	const handleCreateCollection = () => {
		setIsCreating(true);
		setCreatingError(null);
		return apiFetch('/api/collections', {
			method: 'POST',
			body: JSON.stringify({
				communityId: communityData.id,
				title: title,
				kind: kindRadio.state,
			}),
		})
			.then((newCollection) => {
				window.location.href = getDashUrl({ collectionSlug: newCollection.slug });
			})
			.catch((err) => {
				setIsCreating(false);
				setCreatingError(err);
			});
	};

	const renderKindButton = (kind) => {
		const { key, description } = kind;
		return (
			<Radio {...kindRadio} key={key} value={key}>
				{({ checked, ...restProps }) => (
					<button
						type="button"
						className={classNames(
							'bp3-button',
							'bp3-outlined',
							'kind-button',
							checked && 'bp3-active',
						)}
						{...restProps}
					>
						<Icon icon={getSchemaForKind(key).bpDisplayIcon} />
						<div className="text">
							<div className="title">{key}</div>
							<div>{description}</div>
						</div>
					</button>
				)}
			</Radio>
		);
	};

	return (
		<Overlay className="create-collection-dialog-component" isOpen={isOpen} onClose={onClose}>
			<Card className="dialog-card" elevation={4}>
				<h4>Create a new Collection</h4>
				<ControlGroup>
					<InputGroup
						large
						className="collection-title-input"
						placeholder="Enter collection title..."
						value={title}
						onKeyDown={(evt) => {
							if (evt.key === 'Enter' && title) {
								handleCreateCollection();
							}
						}}
						onChange={(evt) => {
							setTitle(evt.target.value);
						}}
					/>
					<Button
						large
						onClick={handleCreateCollection}
						disabled={!title}
						loading={isCreating}
					>
						Create
					</Button>
				</ControlGroup>
				{creatingError && (
					<Callout
						className="error-callout"
						intent="warning"
						title="Error creating Collection."
					/>
				)}
				<RadioGroup
					{...kindRadio}
					aria-label="Choose collection type"
					className="kind-buttons"
				>
					{kinds.map(renderKindButton)}
				</RadioGroup>
			</Card>
		</Overlay>
	);
};

CreateCollectionDialog.propTypes = propTypes;
export default CreateCollectionDialog;
