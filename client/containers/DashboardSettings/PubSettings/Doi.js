import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, FormGroup } from '@blueprintjs/core';

import { getSchemaForKind } from 'utils/collections/schemas';
import { apiFetch } from 'client/utils/apiFetch';

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
			isLoading: false,
			justSetDoi: false,
		};
		this.handleAssignDoi = this.handleAssignDoi.bind(this);
	}

	handleAssignDoi() {
		const { communityData, pubData, updatePubData } = this.props;
		this.setState({ isLoading: true });
		return apiFetch('/api/doi/pub', {
			method: 'POST',
			body: JSON.stringify({
				pubId: pubData.id,
				communityId: communityData.id,
			}),
		})
			.then(({ dois: { pub: pubDoi } }) => {
				updatePubData({ doi: pubDoi });
				this.setState({ isLoading: false, justSetDoi: true });
			})
			.catch(() => {
				this.setState({ isLoading: false });
			});
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
		if (!pubData.doi) {
			return <p>A DOI can be registered for each Pub by admins of this community.</p>;
		}
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
		return <p>DOIs have been registered for this pub.</p>;
	}

	renderDoi() {
		const { pubData } = this.props;
		if (!pubData.doi) {
			return null;
		}
		return (
			<p>
				Pub DOI:{' '}
				<a className="doi-link" href={`https://doi.org/${pubData.doi}`}>
					{pubData.doi}
				</a>
			</p>
		);
	}

	render() {
		const {
			pubData: { doi },
			canIssueDoi,
		} = this.props;
		const { isLoading, justSetDoi } = this.state;
		return (
			<div className="pub-settings-container_doi-component">
				{this.renderStatusMessage()}
				{this.renderCollectionContextMessage()}
				{this.renderDoi()}
				<FormGroup
					helperText={
						doi &&
						!justSetDoi && (
							<React.Fragment>
								If you&apos;ve changed aspects of this pub and wish to update its
								DOI deposit, you can do so here. In the future, PubPub will resubmit
								such changes automatically.
							</React.Fragment>
						)
					}
				>
					<Button
						text={
							justSetDoi ? 'Submitted!' : doi ? 'Resubmit DOI deposit' : 'Assign DOI'
						}
						loading={isLoading}
						onClick={this.handleAssignDoi}
						disabled={!canIssueDoi || justSetDoi}
						icon={justSetDoi && 'tick'}
					/>
				</FormGroup>
			</div>
		);
	}
}

Doi.propTypes = propTypes;
export default Doi;
