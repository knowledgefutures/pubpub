import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Button, Callout, Divider } from '@blueprintjs/core';

import { PubEdgeListingCard, PubEdgeEditor } from 'components';
import { MenuButton, MenuItem } from 'components/Menu';
import { apiFetch } from 'client/utils/apiFetch';
import { usePendingChanges } from 'utils/hooks';
import { RelationType, relationTypeDefinitions } from 'utils/pubEdge';

import NewEdgeInput from './NewEdgeInput';

require('./newEdgeEditor.scss');

type Props = {
	availablePubs: {
		id: string;
		title: string;
		avatar?: string;
	}[];
	onCreateNewEdge: (...args: any[]) => any;
	onChangeCreatingState: (...args: any[]) => any;
	pubData: {
		title?: string;
		id?: string;
	};
	usedPubIds: string[];
};

const createCandidateEdge = (resource, relationType = RelationType.Reply) => {
	return {
		relationType: relationType,
		pubIsParent: true,
		...resource,
	};
};

const stripMarkupFromString = (string) => {
	if (string) {
		const div = document.createElement('div');
		div.innerHTML = string;
		return div.innerText;
	}
	return string;
};

const NewEdgeEditor = (props: Props) => {
	const { availablePubs, onChangeCreatingState, onCreateNewEdge, pubData, usedPubIds } = props;
	const [newEdge, setNewEdge] = useState<any>(null);
	const [isCreatingEdge, setIsCreatingEdge] = useState(false);
	const [errorCreatingEdge, setErrorCreatingEdge] = useState(null);
	const { pendingPromise } = usePendingChanges();

	const currentRelationName =
		newEdge &&
		relationTypeDefinitions[newEdge.relationType] &&
		relationTypeDefinitions[newEdge.relationType].name;

	useEffect(() => onChangeCreatingState(!!newEdge), [newEdge, onChangeCreatingState]);

	const handleSelectItem = (item) => {
		const { targetPub, externalPublication, createNewFromUrl } = item;
		if (targetPub) {
			setNewEdge(createCandidateEdge({ targetPub: targetPub, targetPubId: targetPub.id }));
		} else if (externalPublication) {
			setNewEdge(
				createCandidateEdge({
					externalPublication: {
						...externalPublication,
						description: stripMarkupFromString(externalPublication.description),
					},
				}),
			);
		} else if (createNewFromUrl) {
			setNewEdge(
				createCandidateEdge({
					externalPublication: {
						url: createNewFromUrl,
						contributors: [],
					},
				}),
			);
		}
	};

	const handleEdgeDirectionSwitch = () => {
		setNewEdge({
			...newEdge,
			pubIsParent: !newEdge.pubIsParent,
		});
	};

	const handleEdgeRelationTypeChange = (relationType) => {
		setNewEdge({
			...newEdge,
			relationType: relationType,
		});
	};

	const handleCreateEdge = () => {
		setIsCreatingEdge(true);
		setErrorCreatingEdge(null);
		pendingPromise(
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'post' does not exist on type '(path: any... Remove this comment to see the full error message
			apiFetch.post('/api/pubEdges', {
				...newEdge,
				pubId: pubData.id,
				// Don't send the whole Pub, just the ID
				targetPub: undefined,
			}),
		)
			.then((createdEdge) => {
				onCreateNewEdge(createdEdge);
				setIsCreatingEdge(false);
				setNewEdge(null);
			})
			.catch((err) => {
				setIsCreatingEdge(false);
				setErrorCreatingEdge(err);
			});
	};

	const renderNewEdgeControls = () => {
		const { externalPublication, targetPub } = newEdge;
		const canCreateEdge = targetPub || (externalPublication && externalPublication.title);
		return (
			<div className="new-edge-controls">
				<PubEdgeListingCard
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'false' is not assignable to type 'never'.
					isInboundEdge={false}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'never'.
					pubEdge={newEdge}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
					pubEdgeElement={
						externalPublication && (
							<PubEdgeEditor
								externalPublication={externalPublication}
								onUpdateExternalPublication={(update) =>
									setNewEdge({
										...newEdge,
										externalPublication: { ...externalPublication, ...update },
									})
								}
							/>
						)
					}
				/>
				{errorCreatingEdge && (
					<Callout intent="warning" className="error-callout">
						There was an error creating this Pub connection.
					</Callout>
				)}
				<div className="controls-row">
					<Button icon="swap-vertical" onClick={handleEdgeDirectionSwitch}>
						Switch direction
					</Button>
					<MenuButton
						aria-label="Select relationship type"
						buttonProps={{
							rightIcon: 'chevron-down',
							// @ts-expect-error
							children: `Type: ${currentRelationName}`,
						}}
					>
						{Object.entries(relationTypeDefinitions).map(
							([relationType, definition]) => {
								const { name } = definition;
								const selected = newEdge.relationType === relationType;
								return (
									<MenuItem
										text={name}
										onClick={() => handleEdgeRelationTypeChange(relationType)}
										key={relationType}
										icon={selected ? 'tick' : 'blank'}
									/>
								);
							},
						)}
					</MenuButton>
					<Divider />
					<Button className="cancel-button" onClick={() => setNewEdge(null)}>
						Cancel
					</Button>
					<Button
						intent="primary"
						onClick={handleCreateEdge}
						loading={isCreatingEdge}
						disabled={!canCreateEdge}
					>
						Add connection
					</Button>
				</div>
			</div>
		);
	};

	const renderInputControl = () => {
		return (
			<NewEdgeInput
				availablePubs={availablePubs}
				usedPubIds={usedPubIds}
				onSelectItem={handleSelectItem}
			/>
		);
	};

	return (
		<div className={classNames('new-edge-editor-component', newEdge && 'has-new-edge')}>
			{newEdge ? renderNewEdgeControls() : renderInputControl()}
		</div>
	);
};
export default NewEdgeEditor;
