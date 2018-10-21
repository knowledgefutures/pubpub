import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, NonIdealState } from '@blueprintjs/core';
import { apiFetch } from 'utilities';

require('./dashboardPubs.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubsData: PropTypes.array.isRequired,
};

class DashboardPubs extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: false,
		};

		this.createPub = this.createPub.bind(this);
	}

	createPub() {
		this.setState({ isLoading: true });
		return apiFetch('/api/pubs', {
			method: 'POST',
			body: JSON.stringify({
				communityId: this.props.communityData.id,
				defaultTagIds: this.props.communityData.defaultPubTags || [],
			})
		})
		.then((result)=> {
			window.location.href = result;
		})
		.catch((err)=> {
			console.error(err);
			this.setState({ isLoading: false });
		});
	}

	render() {
		return (
			<div className="dashboard-pubs-component">
				<h1 className="content-title">Pubs</h1>
				{!this.props.pubsData.length &&
					<NonIdealState
						title="No Pubs"
						description="All pubs in your community will be listed here. Get started by creating your first pub."
						visual="widget"
						action={
							<Button
								text="Create Pub"
								onClick={this.createPub}
								loading={this.state.isLoading}
							/>
						}
					/>
				}
				{this.props.pubsData.sort((foo, bar)=> {
					if (foo.title < bar.title) { return -1; }
					if (foo.title > bar.title) { return 1; }
					return 0;
				}).map((pub)=> {
					const authors = pub.attributions.filter((attribution)=> {
						return attribution.isAuthor;
					});
					return (
						<div key={`pub-${pub.id}`} className="pub-wrapper">
							<div className="header">
								<div className="title">
									<a href={`/pub/${pub.slug}`}>{pub.title}</a>
									{!!pub.versions.length && (pub.isDraftEditor || pub.isDraftViewer || pub.isManager) &&
										<a className="draft" href={`/pub/${pub.slug}/draft`}>Go To Working Draft</a>
									}
								</div>
								<div className="nowrap">
									{pub.pubTags.map((pubTag)=> {
										return <span className="pt-tag pt-minimal pt-small">{pubTag.tag.title}</span>;
									})}
								</div>
								{!pub.versions.length &&
									<div className="nowrap">Working Draft</div>
								}
								{!!pub.versions.length &&
									<div className="nowrap">{pub.versions.length} Saved Version{pub.versions.length === 1 ? '' : 's'}</div>
								}
							</div>
							<div className="authors">
								{!!authors.length &&
									<span>by </span>
								}
								{authors.sort((foo, bar)=> {
									if (foo.order < bar.order) { return -1; }
									if (foo.order > bar.order) { return 1; }
									if (foo.createdAt < bar.createdAt) { return 1; }
									if (foo.createdAt > bar.createdAt) { return -1; }
									return 0;
								}).map((attribution, index, array)=> {
									const separator = index === array.length - 1 || array.length === 2 ? '' : ', ';
									const prefix = index === array.length - 1 && index !== 0 ? ' and ' : '';
									if (attribution.user.slug) {
										return (
											<span key={`author-${attribution.id}`}>
												{prefix}
												<a href={`/user/${attribution.user.slug}`}>{attribution.user.fullName}</a>
												{separator}
											</span>
										);
									}
									return <span key={`author-${attribution.id}`}>{prefix}{attribution.user.fullName}{separator}</span>;
								})}
							</div>
						</div>
					);
				})}
			</div>
		);
	}
}

DashboardPubs.propTypes = propTypes;
export default DashboardPubs;
