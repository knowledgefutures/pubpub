import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Classes, Dialog, Intent } from '@blueprintjs/core';
import { Icon, InputField } from 'components';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'utils';
import { getSchemaForKind } from 'shared/collections/schemas';

require('./createCollectionDialog.scss');

const propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
};

const CreateCollectionDialog = (props) => {
	const { isOpen, onClose } = props;
	const { communityData } = usePageContext();
	const [isCreating, setIsCreating] = useState(false);
	const [creatingError, setCreatingError] = useState(undefined);
	const [title, setTitle] = useState('');
	const [kind, setKind] = useState('tag');

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

	const handleCreateCollection = () => {
		setIsCreating(true);
		return apiFetch('/api/collections', {
			method: 'POST',
			body: JSON.stringify({
				communityId: communityData.id,
				title: title,
				kind: kind,
			}),
		})
			.then((newCollection) => {
				window.location.href = `/dash/collection/${newCollection.slug}`;
			})
			.catch((err) => {
				setIsCreating(false);
				setCreatingError(err);
			});
	};

	return (
		<Dialog
			className="create-collection-dialog-component"
			isOpen={isOpen}
			onClose={onClose}
			title="Create New collection"
			icon={<Icon icon="collection" />}
		>
			<div className={Classes.DIALOG_BODY}>
				<InputField
					label="Collection Title"
					placeholder="Enter collection title..."
					isRequired={true}
					value={title}
					onChange={(evt) => {
						setTitle(evt.target.value);
					}}
				/>
				<InputField label="Collection Type">
					<div className="kind-buttons">
						{kinds.map((item) => {
							const { key, description } = item;
							return (
								<Button
									key={key}
									className="kind-button"
									text={
										<div>
											<div className="title">{key}</div>
											<div>{description}</div>
										</div>
									}
									icon={getSchemaForKind(key).bpDisplayIcon}
									active={kind === key}
									onClick={() => {
										setKind(key);
									}}
								/>
							);
						})}
					</div>
				</InputField>
			</div>
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					<InputField error={creatingError && 'Error Creating Collection'}>
						<Button
							name="login"
							type="submit"
							text="Create Collection"
							onClick={handleCreateCollection}
							intent={Intent.PRIMARY}
							disabled={!title}
							loading={isCreating}
						/>
					</InputField>
				</div>
			</div>
		</Dialog>
	);
};

CreateCollectionDialog.propTypes = propTypes;
export default CreateCollectionDialog;
