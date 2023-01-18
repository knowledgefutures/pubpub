import React, { Component } from 'react';
import { Button, Callout, FormGroup, InputGroup } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { AssignDoi } from 'components';
import { DepositTarget } from 'types';
import { getPrimaryCollection } from 'utils/collections/primary';
import { getSchemaForKind } from 'utils/collections/schemas';
import { PUBPUB_DOI_PREFIX } from 'utils/crossref/communities';
import { isDoi } from 'utils/crossref/parseDoi';
import {
	findParentEdgeByRelationTypes,
	RelationType,
	relationTypeDefinitions,
} from 'utils/pubEdge/relations';

require('./doi.scss');

type Props = {
	canIssueDoi: boolean;
	communityData: any;
	pubData: any;
	updatePubData: (...args: any[]) => any;
	depositTarget?: DepositTarget;
};

const extractDoiSuffix = (doi: string, depositTarget?: DepositTarget) => {
	const prefix = depositTarget?.doiPrefix ?? PUBPUB_DOI_PREFIX;
	return doi.replace(`${prefix}/`, '');
};

type State = any;

class Doi extends Component<Props, State> {
	constructor(props: Props) {
		super(props);

		const [, doiSuffix] = (props.pubData.doi || '').split('/');

		this.state = {
			doiSuffix,
			error: false,
			justSetDoi: false,
			deleting: false,
			generating: false,
			success: false,
			updating: false,
		};

		this.handleDeposit = this.handleDeposit.bind(this);
		this.handleUpdateDoiClick = this.handleUpdateDoiClick.bind(this);
		this.handleGenerateDoiClick = this.handleGenerateDoiClick.bind(this);
		this.handleDeleteDoiClick = this.handleDeleteDoiClick.bind(this);
	}

	getDoiPrefix() {
		return this.props.depositTarget?.doiPrefix ?? PUBPUB_DOI_PREFIX;
	}

	getFullDoi() {
		return `${this.getDoiPrefix()}/${this.state.doiSuffix}`;
	}

	getHelperText(invalidDoi) {
		const { success, error } = this.state;
		let helperText = '';

		if (invalidDoi) {
			helperText = 'Invalid DOI suffix';
		} else if (error) {
			helperText = 'There was a problem updating the DOI suffix';
		} else if (success) {
			helperText =
				'DOI suffix updated succesfully on PubPub. To take effect, the DOI must be submitted to Crossref.';
		}

		return helperText;
	}

	getIntent(invalidDoi) {
		const { success, error } = this.state;
		let intent = 'none';

		if (invalidDoi || error) {
			intent = 'danger';
		} else if (success) {
			intent = 'success';
		}

		return intent;
	}

	findSupplementTo() {
		const { pubData } = this.props;
		return findParentEdgeByRelationTypes(pubData, [RelationType.Supplement]);
	}

	findParentPubEdge() {
		const { pubData } = this.props;
		const parentEdge = findParentEdgeByRelationTypes(pubData, [
			RelationType.Supplement,
			RelationType.Review,
			RelationType.Rejoinder,
			RelationType.Preprint,
		]);

		if (!parentEdge || parentEdge.externalPublication) {
			return null;
		}

		return parentEdge;
	}

	disabledDueToParentWithoutDoi() {
		const parentEdge = this.findParentPubEdge();

		if (!parentEdge) {
			return false;
		}

		const parentPub = parentEdge.pubIsParent ? parentEdge.pub : parentEdge.targetPub;

		return parentPub && !parentPub.doi;
	}

	disabledDueToNoReleases() {
		const { pubData } = this.props;
		return pubData.releases.length === 0;
	}

	disabledDueToUnmanagedPrefix() {
		return this.props.depositTarget && !this.props.depositTarget.isPubPubManaged;
	}

	handleDeposit(doi) {
		const { updatePubData } = this.props;

		this.setState({ justSetDoi: true });
		updatePubData({ doi });
	}

	async updateDoi(doi, pendingStateKey, fallback) {
		const { updating, deleting } = this.state;
		const { communityData, pubData, updatePubData } = this.props;

		if (updating || deleting) {
			return;
		}

		this.setState({
			[pendingStateKey]: true,
			error: false,
			success: false,
		});

		try {
			const response = await apiFetch('/api/pubs', {
				method: 'PUT',
				body: JSON.stringify({
					doi,
					pubId: pubData.id,
					communityId: communityData.id,
				}),
			});
			this.setState({
				[pendingStateKey]: false,
				doiSuffix: extractDoiSuffix(response.doi, this.props.depositTarget),
				error: false,
				success: true,
			});
			updatePubData({ doi: response.doi });
		} catch (err) {
			this.setState({
				[pendingStateKey]: false,
				doiSuffix: fallback,
				error: true,
				success: false,
			});
		}
	}

	async handleDeleteDoiClick() {
		this.updateDoi('', 'deleting', this.state.doiSuffix);
	}

	async handleGenerateDoiClick() {
		const { updating, deleting, generating } = this.state;
		const { communityData, pubData } = this.props;

		if (updating || deleting || generating) {
			return;
		}

		this.setState({
			generating: true,
			error: false,
			success: false,
		});

		try {
			const params = new URLSearchParams({
				target: 'pub',
				communityId: communityData.id,
				pubId: pubData.id,
			});

			// Fetch a DOI preview which contains a newly generated DOI.
			const response = await apiFetch(`/api/generateDoi?${params.toString()}`);

			this.setState({
				generating: false,
				doiSuffix: extractDoiSuffix(response.dois.pub, this.props.depositTarget),
				error: false,
				success: false,
			});
		} catch (err) {
			this.setState({
				generating: false,
				error: true,
				success: false,
			});
		}
	}

	async handleUpdateDoiClick() {
		const { pubData } = this.props;
		const doi = this.getFullDoi();
		const currentDoiSuffix = extractDoiSuffix(pubData.doi || '', this.props.depositTarget);
		this.updateDoi(doi, 'updating', currentDoiSuffix);
	}

	isDoiEditableWithoutRelations() {
		const { canIssueDoi, pubData } = this.props;
		const { justSetDoi } = this.state;
		const doiPrefix = this.getDoiPrefix();

		// The DOI is editable if
		return (
			// user has the correct permissions
			canIssueDoi &&
			// a deposit has not been submitted yet for this work
			!(justSetDoi || pubData.crossrefDepositRecordId) &&
			// and the Community has a custom DOI prefix
			this.props.depositTarget &&
			doiPrefix !== PUBPUB_DOI_PREFIX
		);
	}

	isDoiEditable() {
		return (
			this.isDoiEditableWithoutRelations() &&
			// the Pub is not a supplement to another work
			!this.findSupplementTo()
		);
	}

	renderParentEdgeRelation() {
		const parentPubEdge = this.findParentPubEdge();

		if (!parentPubEdge) {
			return null;
		}

		const relationDefinition = relationTypeDefinitions[parentPubEdge.relationType];
		const { article, preposition, name } = relationDefinition;
		const relationString = (
			<>
				{article} <strong>{name}</strong> {preposition}
			</>
		);

		return relationString;
	}

	renderCollectionContextMessage() {
		const { pubData } = this.props;
		const { justSetDoi } = this.state;
		if (justSetDoi) {
			return null;
		}
		const collection = getPrimaryCollection(pubData.collectionPubs);
		if (collection) {
			const schema = getSchemaForKind(collection.kind)!;
			return (
				<p>
					This Pub will be cited as a member of the {schema.label.singular},{' '}
					<b>{collection.title}</b>. You can change this by updating the{' '}
					<em>Primary Collection</em> of the Pub from the Collections tab.
				</p>
			);
		}
		return null;
	}

	renderStatusMessage() {
		const { pubData } = this.props;
		const { justSetDoi } = this.state;

		if (justSetDoi) {
			return (
				<Callout intent="success" title="Success!">
					<p>Successfully submitted a DOI registration for this Pub.</p>
					<p>
						Registration may take a few hours to complete in Crossref&apos;s system. If
						DOI URLs do not work immediately, the registration is likely still
						processing.
					</p>
				</Callout>
			);
		}

		return (
			<>
				{!pubData.doi && <p>A DOI can be set for each Pub by admins of this Community.</p>}
				{this.disabledDueToUnmanagedPrefix() && (
					<Callout intent="warning">
						This Pub cannot be deposited to Crossref via PubPub because there is no
						Crossref account connected to PubPub for this Community.
					</Callout>
				)}
				{pubData.doi &&
					!pubData.crossrefDepositRecordId &&
					!this.disabledDueToNoReleases() &&
					!this.disabledDueToUnmanagedPrefix() && (
						<Callout intent="warning">
							A DOI has been assigned to this Pub, but it has not yet been deposited
							to Crossref.
						</Callout>
					)}
				{pubData.crossrefDepositRecordId && <p>This Pub has been deposited to Crossref.</p>}
				{this.isDoiEditableWithoutRelations() && this.findSupplementTo() && (
					<Callout intent="warning">
						The DOI for this Pub is not editable because it is a{' '}
						<strong>Supplement</strong> to another Pub.
					</Callout>
				)}
			</>
		);
	}

	renderContent() {
		const { pubData, canIssueDoi } = this.props;
		const { justSetDoi } = this.state;

		if (!canIssueDoi) {
			return (
				<>
					{this.renderStatusMessage()}
					{this.renderDoi()}
				</>
			);
		}

		return (
			<>
				{this.renderStatusMessage()}
				{this.renderCollectionContextMessage()}
				{this.renderDoi()}

				<FormGroup
					helperText={
						pubData.doi &&
						!justSetDoi && (
							<>
								If you&apos;ve changed aspects of this pub and wish to update its
								DOI deposit, you can do so here. In the future, PubPub will resubmit
								such changes automatically.{' '}
								{this.isDoiEditable() && (
									<>
										{' '}
										PubPub will automatically assign a DOI if the suffix is left
										blank. Please note that{' '}
										<strong>
											once submitted, the DOI will no longer be editable.
										</strong>
									</>
								)}
							</>
						)
					}
				>
					{this.disabledDueToParentWithoutDoi() && (
						<Callout intent="warning">
							This Pub cannot be deposited to Crossref because it is{' '}
							{this.renderParentEdgeRelation()} its parent Pub, and its parent Pub
							does not have a DOI.
						</Callout>
					)}
					{this.disabledDueToNoReleases() && (
						<Callout intent="warning">
							This Pub cannot be deposited to Crossref because it has no published
							releases.
						</Callout>
					)}
					<AssignDoi
						communityData={this.props.communityData}
						// @ts-expect-error ts-migrate(2322) FIXME: Type '(doi: any) => void' is not assignable to typ... Remove this comment to see the full error message
						onDeposit={this.handleDeposit}
						pubData={this.props.pubData}
						target="pub"
						disabled={
							this.disabledDueToParentWithoutDoi() ||
							this.disabledDueToNoReleases() ||
							this.disabledDueToUnmanagedPrefix()
						}
					/>
				</FormGroup>
			</>
		);
	}

	renderDoi() {
		const { pubData } = this.props;
		const { doiSuffix, updating, generating, deleting } = this.state;
		const fullDoi = this.getFullDoi();
		const invalidDoi = doiSuffix && !isDoi(fullDoi);
		const intent = this.getIntent(invalidDoi);
		const helperText = this.getHelperText(invalidDoi);

		if (this.isDoiEditable()) {
			return (
				<FormGroup
					helperText={helperText}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type '"success"... Remove this comment to see the full error message
					intent={intent}
					className="doi"
					label="DOI Suffix"
				>
					<InputGroup
						placeholder="Enter a DOI suffix..."
						value={doiSuffix}
						onChange={(e) => this.setState({ doiSuffix: e.target.value })}
						leftElement={<span className="doi-prefix">{this.getDoiPrefix()}/</span>}
						style={{ zIndex: 0 }}
					/>
					<Button
						disabled={!doiSuffix || invalidDoi || deleting || generating}
						text="Update Suffix"
						loading={updating}
						onClick={this.handleUpdateDoiClick}
						intent="success"
					/>
					<Button
						disabled={invalidDoi || deleting || updating}
						text="Generate Suffix"
						loading={generating}
						onClick={this.handleGenerateDoiClick}
					/>
					<Button
						disabled={!pubData.doi || invalidDoi || updating || generating}
						text="Delete"
						loading={deleting}
						onClick={this.handleDeleteDoiClick}
						intent="danger"
					/>
				</FormGroup>
			);
		}

		return (
			<>
				{pubData.doi && (
					<p>
						Pub DOI:{' '}
						<a className="doi-link" href={`https://doi.org/${pubData.doi}`}>
							{pubData.doi}
						</a>
					</p>
				)}
			</>
		);
	}

	render() {
		return <div className="pub-settings-container_doi-component">{this.renderContent()}</div>;
	}
}
export default Doi;
