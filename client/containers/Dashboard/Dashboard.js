import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import DashboardSide from 'components/DashboardSide/DashboardSide';
import DashboardCreatePage from 'components/DashboardCreatePage/DashboardCreatePage';
import DashboardSettings from 'components/DashboardSettings/DashboardSettings';
import DashboardTeam from 'components/DashboardTeam/DashboardTeam';
import DashboardTags from 'components/DashboardTags/DashboardTags';
import DashboardPubs from 'components/DashboardPubs/DashboardPubs';
import DashboardPage from 'components/DashboardPage/DashboardPage';

import { hydrateWrapper } from 'utilities';

require('./dashboard.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	pageData: PropTypes.object.isRequired,
	pubsData: PropTypes.array.isRequired,
};

class Dashboard extends Component {
	constructor(props) {
		super(props);
		this.state = {
			communityData: props.communityData,
			pageData: props.pageData,
		};
		this.setCommunityData = this.setCommunityData.bind(this);
		this.setPageData = this.setPageData.bind(this);
	}

	setCommunityData(newCommunityData) {
		this.setState({ communityData: newCommunityData });
	}

	setPageData(newPageData) {
		this.setState({ pageData: newPageData });
	}

	render() {
		const communityData = this.state.communityData;
		const pageData = this.state.pageData;
		const activeSlug = this.props.locationData.params.slug || '';
		const activeMode = this.props.locationData.params.mode || '';
		return (
			<div id="dashboard-container">
				<PageWrapper
					loginData={this.props.loginData}
					communityData={communityData}
					locationData={this.props.locationData}
					hideNav={true}
					hideFooter={true}
				>
					<div className="container">
						<div className="row">
							<div className="col-12 dashboard-columns">
								<div className="side-content">
									<DashboardSide
										pages={communityData.pages}
										activeTab={activeSlug || activeMode}
									/>
								</div>

								<div className="main-content">
									{(() => {
										switch (activeMode) {
											case 'pubs':
												return (
													<DashboardPubs
														communityData={communityData}
														pubsData={this.props.pubsData}
													/>
												);
											case 'team':
												return (
													<DashboardTeam
														communityData={communityData}
														setCommunityData={this.setCommunityData}
													/>
												);
											case 'settings':
												return (
													<DashboardSettings
														communityData={communityData}
														setCommunityData={this.setCommunityData}
													/>
												);
											case 'tags':
												return (
													<DashboardTags
														communityData={communityData}
														setCommunityData={this.setCommunityData}
													/>
												);
											case 'page':
												return (
													<DashboardCreatePage
														communityData={communityData}
														hostname={this.props.locationData.hostname}
													/>
												);
											default:
												return (
													<DashboardPage
														communityData={communityData}
														locationData={this.props.locationData}
														pageData={pageData}
														setCommunityData={this.setCommunityData}
														setPageData={this.setPageData}
													/>
												);
										}
									})()}
								</div>
							</div>
						</div>
					</div>
				</PageWrapper>
			</div>
		);
	}
}

Dashboard.propTypes = propTypes;
export default Dashboard;

hydrateWrapper(Dashboard);
