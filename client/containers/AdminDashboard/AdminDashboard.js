import React from 'react';
import PropTypes from 'prop-types';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { apiFetch, hydrateWrapper } from 'utilities';
import { Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

require('./adminDashboard.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const Chart = function(props) {
	return (
		<div>
			<h2>{props.title}</h2>
			<BarChart width={730} height={250} data={props.data}>
				<XAxis dataKey="month" />
				<YAxis />
				<Tooltip />
				<Bar dataKey="count" />
			</BarChart>
		</div>
	)
};

class AdminDashboard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			pubPubData: {},
			isLoading: true
		};
	}

	componentDidMount() {
		apiFetch('/api/dashboard', {
			method: 'GET',
		})
		.then((data)=> {
			this.setState({
				pubPubData: data,
				isLoading: false
			});
			console.log(data);
		})
		.catch((err)=> {
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
								{!this.state.isLoading &&
									<div>
										<Chart data={this.state.pubPubData.users} title="New Users" />
										<Chart data={this.state.pubPubData.communities} title="New Communities" />
										<Chart data={this.state.pubPubData.discussions} title="New Discussions" />
										<Chart data={this.state.pubPubData.activeCommunities} title="Active Communities" />
										<Chart data={this.state.pubPubData.activeUsers} title="Active Users" />
									</div>
								}
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
