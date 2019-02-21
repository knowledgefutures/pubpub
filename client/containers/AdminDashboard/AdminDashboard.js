import React from 'react';
import PropTypes from 'prop-types';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { apiFetch, hydrateWrapper } from 'utilities';
import Chart from './Chart';

require('./adminDashboard.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

class AdminDashboard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			pubPubData: {},
			isLoading: true,
		};
	}

	componentDidMount() {
		apiFetch('/api/admin-dashboard', {
			method: 'GET',
		})
			.then((data) => {
				this.setState({
					pubPubData: data,
					isLoading: false,
				});
			})
			.catch((err) => {
				console.warn(err);
			});
	}

	render() {
		return (
			<div id="dashboard-container">
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
					hideNav={true}
					hideFooter={true}
				>
					<div className="container">
						<div className="row">
							<div className="col-12">
								<h1>Admin Dashboard</h1>
								{!this.state.isLoading && (
									<div>
										<Chart data={this.state.pubPubData.users} title="Users" />
										<Chart
											data={this.state.pubPubData.communities}
											title="Communities"
										/>
										<Chart
											data={this.state.pubPubData.discussions}
											title="Discussions"
										/>
										<Chart
											data={this.state.pubPubData.subscribers}
											title="Newsletter Subscribers"
										/>
									</div>
								)}
							</div>
						</div>
					</div>
				</PageWrapper>
			</div>
		);
	}
}

AdminDashboard.propTypes = propTypes;
export default AdminDashboard;

hydrateWrapper(AdminDashboard);
