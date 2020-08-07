import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormGroup, Button, InputGroup, Callout } from '@blueprintjs/core';

import {
	choosePrefixByCommunityId,
	managedDoiPrefixes,
	PUBPUB_DOI_PREFIX,
} from 'utils/crossref/communities';
import { apiFetch } from 'client/utils/apiFetch';
import { getSchemaForKind } from 'utils/collections/schemas';
import { isDoi } from 'utils/crossref/parseDoi';
import { RelationType, findParentEdgeByRelationTypes } from 'utils/pubEdge/relations';

import { AssignDoi } from 'components';

require('./doi.scss');

const propTypes = {
	canIssueDoi: PropTypes.bool.isRequired,
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	updatePubData: PropTypes.func.isRequired,
};

const extractDoiSuffix = (doi, community) => {
	const prefix = choosePrefixByCommunityId(community.id);

	return doi.replace(`${prefix}/`, '');
};

class Doi extends Component {
	constructor(props) {
		super(props);

		this.state = {
			doiSuffix: extractDoiSuffix(props.pubData.doi || '', props.communityData),
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
		return choosePrefixByCommunityId(this.props.communityData.id);
	}

	getFullDoi() {
		return `${this.getDoiPrefix()}/${this.state.doiSuffix}`;
	}

	getHelperText(invalidDoi) {
		const { success, error } = this.state;
		let helperText = '';

		if (invalidDoi) {
			helperText = 'Invalid DOI';
		} else if (error) {
			helperText = 'There was a problem updating the DOI';
		} else if (success) {
			helperText = 'DOI updated succesfully!';
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

	handleDeposit(doi) {
		const { updatePubData } = this.props;

		this.setState({ justSetDoi: true });
		updatePubData({ doi: doi });
	}

	findSupplementTo() {
		const { pubData } = this.props;
		return findParentEdgeByRelationTypes(pubData, [RelationType.Supplement]);
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
					doi: doi,
					pubId: pubData.id,
					communityId: communityData.id,
				}),
			});
			this.setState({
				[pendingStateKey]: false,
				doiSuffix: extractDoiSuffix(response.doi, communityData),
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
				doiSuffix: extractDoiSuffix(response.dois.pub, communityData),
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
		const { pubData, communityData } = this.props;
		const doi = this.getFullDoi();
		const currentDoiSuffix = extractDoiSuffix(pubData.doi || '', communityData);
		this.updateDoi(doi, 'updating', currentDoiSuffix);
	}

	isDoiEditable() {
		const { canIssueDoi, pubData } = this.props;
		const { justSetDoi } = this.state;
		const doiPrefix = this.getDoiPrefix();

		// The DOI is editable if
		return (
			// user has the correct permissions
			canIssueDoi &&
			// a deposit has not been submitted yet for this work
			!(justSetDoi || pubData.crossrefDepositRecordId) &&
			// the Pub is not a supplement to another work
			!this.findSupplementTo() &&
			// and the community has a custom, hardcoded DOI prefix
			managedDoiPrefixes.includes(doiPrefix) &&
			doiPrefix !== PUBPUB_DOI_PREFIX
		);
	}

	renderCollectionContextMessage() {
		const { pubData } = this.props;
		const { justSetDoi } = this.state;
		if (justSetDoi) {
			return null;
		}
		const primaryCollectionPub = pubData.collectionPubs.find((cp) => cp.isPrimary);
		if (primaryCollectionPub) {
			const { collection } = primaryCollectionPub;
			const schema = getSchemaForKind(collection.kind);
			return (
				<p>
					This pub will be cited as a member of the {schema.label.singular},{' '}
					<b>{collection.title}</b>. You can change this by updating the{' '}
					<em>primary collection</em> of the pub from the Collections tab.
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
					<p>Successfully submitted a DOI registration for this pub.</p>
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
				{!pubData.doi && <p>A DOI can be set for each Pub by admins of this community.</p>}
				{pubData.crossrefDepositRecordId && <p>This Pub has been deposited to Crossref.</p>}
				{this.findSupplementTo() && (
					<Callout intent="warning">
						The DOI for this Pub is not editable because it is a{' '}
						<strong>Supplement</strong> to another Pub.
					</Callout>
				)}
			</>
		);
	}

	disabledDueToParentWithoutDoi() {
		const supplementTo = this.findSupplementTo();
		return (
			supplementTo &&
			!(supplementTo.pubIsParent ? supplementTo.pub : supplementTo.targetPub).doi
		);
	}

	disabledDueToNoReleases() {
		const { pubData } = this.props;
		return pubData.releases.length === 0;
	}

	renderContent() {
		const { pubData, canIssueDoi } = this.props;
		const { justSetDoi } = this.state;
		const supplementTo = this.findSupplementTo();

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
											once submit, the DOI will no longer be editable.
										</strong>
									</>
								)}
							</>
						)
					}
				>
					{this.disabledDueToParentWithoutDoi() && (
						<Callout intent="warning">
							This Pub cannot be deposited to Crossref because it is a{' '}
							<strong>Supplement</strong> and its parent Pub does not have a DOI.
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
						onDeposit={this.handleDeposit}
						pubData={this.props.pubData}
						target="pub"
						disabled={
							this.disabledDueToParentWithoutDoi() || this.disabledDueToNoReleases()
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
						text="Update"
						loading={updating}
						onClick={this.handleUpdateDoiClick}
					/>
					<Button
						disabled={invalidDoi || deleting || updating}
						text="Generate"
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

Doi.propTypes = propTypes;
export default Doi;
