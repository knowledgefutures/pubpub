import React, { useState } from 'react';
import classNames from 'classnames';
import {
	Button,
	Callout,
	Card,
	Classes,
	ControlGroup,
	InputGroup,
	Overlay,
} from '@blueprintjs/core';
import { RadioGroup, Radio, useRadioState } from 'reakit/Radio';

import { Icon } from 'components';
import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { getSchemaForKind } from 'utils/collections/schemas';
import { apiFetch } from 'client/utils/apiFetch';
import { getSlugError } from 'client/utils/slug';
import { SlugStatus } from 'types';

require('./createCollectionDialog.scss');

type Props = {
	isOpen: boolean;
	onClose: (...args: any[]) => any;
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

const CreateCollectionDialog = (props: Props) => {
	const { isOpen, onClose } = props;
	const { communityData } = usePageContext();
	const [isCreating, setIsCreating] = useState(false);
	const [creatingError, setCreatingError] = useState(null);
	const [slugStatusError, setSlugStatusError] = useState('');
	const [title, setTitle] = useState('');
	const kindRadio = useRadioState({ state: 'tag' });

	const handleCreateCollection = () => {
		setIsCreating(true);
		setCreatingError(null);
		return apiFetch('/api/collections', {
			method: 'POST',
			body: JSON.stringify({
				communityId: communityData.id,
				title,
				kind: kindRadio.state,
			}),
		})
			.then((newCollection) => {
				window.location.href = getDashUrl({ collectionSlug: newCollection.slug });
			})
			.catch((err) => {
				setIsCreating(false);
				const slugStatus: SlugStatus =
					err?.type === 'forbidden-slug' ? err.slugStatus : 'available';
				if (slugStatus !== 'available') {
					const slugError = getSlugError(title, slugStatus);
					setSlugStatusError(slugError);
				} else {
					setCreatingError(err);
				}
			});
	};

	const renderKindButton = (kind) => {
		const { key, description } = kind;
		return (
			<Radio {...kindRadio} key={key} value={key}>
				{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'checked' does not exist on type 'Pick<HT... Remove this comment to see the full error message */}
				{({ checked, ...restProps }) => (
					<button
						type="button"
						className={classNames(
							Classes.BUTTON,
							Classes.OUTLINED,
							'kind-button',
							checked && Classes.ACTIVE,
						)}
						{...restProps}
					>
						{/* @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'. */}
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
				<div className="collection-creation-controls">
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
					{slugStatusError && (
						<Callout
							className="error-callout"
							intent="danger"
							title={slugStatusError}
						/>
					)}
					<RadioGroup
						{...kindRadio}
						aria-label="Choose collection type"
						className="kind-buttons"
					>
						{kinds.map(renderKindButton)}
					</RadioGroup>
				</div>
			</Card>
		</Overlay>
	);
};
export default CreateCollectionDialog;
