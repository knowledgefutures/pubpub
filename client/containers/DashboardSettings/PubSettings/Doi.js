import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormGroup, ControlGroup, Button, InputGroup } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { getSchemaForKind } from 'utils/collections/schemas';
import { isDoi } from 'utils/crossref/parseDoi';

import { AssignDoi } from 'components';

require('./doi.scss');

const propTypes = {
	canIssueDoi: PropTypes.bool.isRequired,
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	updatePubData: PropTypes.func.isRequired,
};

class Doi extends Component {
	constructor(props) {
		super(props);
		this.state = {
			doi: props.pubData.doi || '',
			updating: false,
			error: false,
			success: false,
			justSetDoi: false,
		};

		this.handleDeposit = this.handleDeposit.bind(this);
		this.handleDoiUpdate = this.handleDoiUpdate.bind(this);
	}

	handleDeposit(doi) {
		const { updatePubData } = this.props;

		this.setState({ justSetDoi: true });
		updatePubData({ doi: doi });
	}

	async handleDoiUpdate() {
		const { doi } = this.state;
		const { communityData, pubData } = this.props;

		this.setState({
			error: false,
			success: false,
			updating: true,
		});

		try {
			await apiFetch('/api/pubs', {
				method: 'PUT',
				body: JSON.stringify({
					doi: doi,
					pubId: pubData.id,
					communityId: communityData.id,
				}),
			});
			this.setState({
				success: true,
				updating: false,
			});
		} catch (err) {
			this.setState({
				success: false,
				updating: false,
				error: true,
			});
		}
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
				<React.Fragment>
					<p>Successfully submitted a DOI registration for this pub.</p>
					<p>
						Registration may take a few hours to complete in Crossref&apos;s system. If
						DOI URLs do not work immediately, the registration is likely still
						processing.
					</p>
				</React.Fragment>
			);
		}

		if (!pubData.doi) {
			return <p>A DOI can be registered for each Pub by admins of this community.</p>;
		}

		return <p>DOIs have been registered for this pub.</p>;
	}

	getHelperText(invalidDoi) {
		const { success, error } = this.state;
		let helperText = '';

		if (invalidDoi) {
			helperText = 'Invalid DOI';
		} else if (error) {
			helperText = 'There was a problem updating the DOI';
		} else if (success) {
			helperText = 'DOI updated successfully!';
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

	renderDoi() {
		const { canIssueDoi, pubData } = this.props;
		const { justSetDoi, doi, updating } = this.state;
		const doiIsEditable = canIssueDoi && !(justSetDoi || pubData.crossrefDepositRecordId);
		const invalidDoi = doi && !isDoi(doi);
		const intent = this.getIntent(invalidDoi);
		const helperText = this.getHelperText(invalidDoi);

		if (doiIsEditable) {
			return (
				<FormGroup helperText={helperText} intent={intent}>
					<ControlGroup>
						<InputGroup
							label="DOI"
							placeholder="Enter a DOI..."
							value={doi}
							onChange={(e) => this.setState({ doi: e.target.value })}
						/>
						<Button
							disabled={!doi || invalidDoi}
							text="Update"
							loading={updating}
							onClick={this.handleDoiUpdate}
						/>
					</ControlGroup>
				</FormGroup>
			);
		}

		return (
			pubData.doi && (
				<p>
					Pub DOI:{' '}
					<a className="doi-link" href={`https://doi.org/${pubData.doi}`}>
						{pubData.doi}
					</a>
				</p>
			)
		);
	}

	renderContent() {
		const { pubData, canIssueDoi } = this.props;
		const { justSetDoi } = this.state;
		const hasExistingDeposit = justSetDoi || Boolean(pubData.crossrefDepositRecordId);

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

				{!hasExistingDeposit && (
					<p>
						You may also use the button below to have PubPub automatically{' '}
						{!hasExistingDeposit && 'assign a DOI and '} deposit this work to Crossref.
						Depositing the work will overwrite a manually assigned DOI, and{' '}
						<strong>the DOI will no longer be editable.</strong>
					</p>
				)}

				<FormGroup
					helperText={
						pubData.doi &&
						!justSetDoi && (
							<React.Fragment>
								If you&apos;ve changed aspects of this pub and wish to update its
								DOI deposit, you can do so here. In the future, PubPub will resubmit
								such changes automatically.
							</React.Fragment>
						)
					}
				>
					<AssignDoi
						communityData={this.props.communityData}
						onDeposit={this.handleDeposit}
						pubData={this.props.pubData}
						hasExistingDeposit={hasExistingDeposit}
						target="pub"
					/>
				</FormGroup>
			</>
		);
	}

	render() {
		return <div className="pub-settings-container_doi-component">{this.renderContent()}</div>;
	}
}

Doi.propTypes = propTypes;
export default Doi;
