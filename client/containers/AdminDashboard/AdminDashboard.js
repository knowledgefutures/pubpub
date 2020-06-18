import React from 'react';

import { GridWrapper } from 'components';
import { apiFetch } from 'client/utils/apiFetch';

import Chart from './Chart';

require('./adminDashboard.scss');

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
				<GridWrapper>
					<h1>Admin Dashboard</h1>
					{!this.state.isLoading && (
						<div>
							<Chart data={this.state.pubPubData.users} title="Users" />
							<Chart data={this.state.pubPubData.communities} title="Communities" />
							<Chart data={this.state.pubPubData.discussions} title="Discussions" />
							<Chart
								data={this.state.pubPubData.subscribers}
								title="Newsletter Subscribers"
							/>
						</div>
					)}
				</GridWrapper>
			</div>
		);
	}
}

export default AdminDashboard;
