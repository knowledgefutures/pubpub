import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Button, Callout } from '@blueprintjs/core';

import { PubEdgeListingCard, PubEdgeEditor } from 'components';
import { MenuButton, MenuItem } from 'components/Menu';
import { apiFetch } from 'client/utils/apiFetch';
import { usePendingChanges } from 'utils/hooks';
import { RelationType, relationTypeDefinitions } from 'utils/pubEdge';
import { Pub, PubEdge } from 'utils/types';

import NewEdgeInput from './NewEdgeInput';

require('./newEdgeEditor.scss');

type Props = {
	onCreateNewEdge: (edge: PubEdge) => unknown;
	onChangeCreatingState: (isCreating: boolean) => unknown;
	pubData: Pub;
	usedPubIds: string[];
};

const createCandidateEdge = (resource, relationType = RelationType.Reply) => {
	return {
		relationType,
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
	const { onChangeCreatingState, onCreateNewEdge, pubData, usedPubIds } = props;
	const [newEdge, setNewEdge] = useState<any>(null);
	const [isCreatingEdge, setIsCreatingEdge] = useState(false);
	const [errorCreatingEdge, setErrorCreatingEdge] = useState(null);
	const { pendingPromise } = usePendingChanges();

	const currentRelationName =
		newEdge &&
		relationTypeDefinitions[newEdge.relationType] &&
		relationTypeDefinitions[newEdge.relationType].name;

	useEffect(() => void onChangeCreatingState(!!newEdge), [newEdge, onChangeCreatingState]);

	const handleSelectItem = (item) => {
		const { targetPub, externalPublication, createNewFromUrl } = item;
		if (targetPub) {
			setNewEdge(createCandidateEdge({ targetPub, targetPubId: targetPub.id }));
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
			relationType,
		});
	};

	const handleCreateEdge = () => {
		setIsCreatingEdge(true);
		setErrorCreatingEdge(null);
		pendingPromise(
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
				<div className="controls-row">
					<MenuButton
						aria-label="Select relationship type"
						buttonProps={{
							rightIcon: 'chevron-down',
							// @ts-expect-error ts-migrate(2322) FIXME: Type '{ rightIcon: string; children: string; }' is... Remove this comment to see the full error message
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
					<Button icon="swap-vertical" onClick={handleEdgeDirectionSwitch}>
						Switch direction
					</Button>
				</div>
				<PubEdgeListingCard
					pubData={pubData}
					isInboundEdge={false}
					pubEdge={newEdge}
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
								pubData={pubData}
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
		return <NewEdgeInput usedPubIds={usedPubIds} onSelectItem={handleSelectItem} />;
	};

	return (
		<div className={classNames('new-edge-editor-component', newEdge && 'has-new-edge')}>
			<h4>Connection Properties</h4>
			{newEdge ? renderNewEdgeControls() : renderInputControl()}
		</div>
	);
};
export default NewEdgeEditor;
