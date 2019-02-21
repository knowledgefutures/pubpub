import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import { apiFetch } from 'utilities';

require('./pubOptionsDoi.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	// loginData: PropTypes.object.isRequired,
	setPubData: PropTypes.func.isRequired,
};

class PubOptionsDoi extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: false,
			justSetDoi: false,
		};
		this.handleAssignDoi = this.handleAssignDoi.bind(this);
	}

	handleAssignDoi() {
		this.setState({ isLoading: true });
		return apiFetch('/api/doi', {
			method: 'POST',
			body: JSON.stringify({
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
				versionId: this.props.pubData.activeVersion.id,
				slug: this.props.pubData.slug,
			}),
		})
			.then((updatedPubData) => {
				this.setState({ isLoading: false });
				this.props.setPubData({
					...this.props.pubData,
					...updatedPubData,
				});
			})
			.catch(() => {
				this.setState({ isLoading: false });
			});
	}

	render() {
		const pubData = this.props.pubData;
		return (
			<div className="pub-options-doi-component">
				<h1>DOI Assignment</h1>
				{!pubData.doi && (
					<p>
						A DOI can be registered for each pub by community admins. When completed,
						the pub is assigned an article-level DOI and each version is assigned its
						own component DOI. The article-level DOI will always point to the most
						recent version while each version DOI can be used to reference earlier
						snapshots.
					</p>
				)}

				{pubData.doi && !this.state.justSetDoi && (
					<div>
						<p>
							DOIs have been registered for this pub and all of its published
							versions.
						</p>
						<p>
							Pub DOI: <a href={`https://doi.org/${pubData.doi}`}>{pubData.doi}</a>
						</p>
					</div>
				)}

				{pubData.doi && this.state.justSetDoi && (
					<div>
						<p>
							Successfully registered DOIs for this pub and all of its published
							versions!
						</p>
						<p>
							Registration may take a few hours to complete in Crossref&apos;s system.
							If DOI URLs do not work immediately, the registration is likely still
							processing.
						</p>
						<p>
							Pub DOI: <a href={`https://doi.org/${pubData.doi}`}>{pubData.doi}</a>
						</p>
					</div>
				)}
				{!pubData.doi && (
					<Button
						text="Assign DOI"
						loading={this.state.isLoading}
						onClick={this.handleAssignDoi}
					/>
				)}
			</div>
		);
	}
}

PubOptionsDoi.propTypes = propTypes;
export default PubOptionsDoi;
