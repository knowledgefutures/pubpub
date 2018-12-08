import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from 'components/Avatar/Avatar';
import UserAutocomplete from 'components/UserAutocomplete/UserAutocomplete';
import { apiFetch } from 'utilities';

require('./dashboardTeam.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	setCommunityData: PropTypes.func.isRequired,
};

class DashboardTeam extends Component {
	constructor(props) {
		super(props);
		this.handleAdminAdd = this.handleAdminAdd.bind(this);
		this.handleAdminRemove = this.handleAdminRemove.bind(this);
	}

	handleAdminAdd(user) {
		if (!user) { return null; }
		return apiFetch('/api/communityAdmins', {
			method: 'POST',
			body: JSON.stringify({
				userId: user.id,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			this.props.setCommunityData({
				...this.props.communityData,
				admins: [
					result,
					...this.props.communityData.admins,
				]
			});
		});
	}

	handleAdminRemove(userId) {
		return apiFetch('/api/communityAdmins', {
			method: 'DELETE',
			body: JSON.stringify({
				userId: userId,
				communityId: this.props.communityData.id,
			})
		})
		.then(()=> {
			this.props.setCommunityData({
				...this.props.communityData,
				admins: this.props.communityData.admins.filter((admin)=> {
					return admin.id !== userId;
				})
			});
		});
	}

	render() {
		return (
			<div className="dashboard-team-component">
				<h1 className="content-title">Team</h1>
				<div className="details">Add administrators to the team. Administrators will be able to publish documents, see private collections, and create new collections.</div>

				<div className="autocomplete-wrapper">
					<UserAutocomplete
						onSelect={this.handleAdminAdd}
						placeholder="Add new administrator..."
						usedUserIds={this.props.communityData.admins.map((item)=> {
							return item.id;
						})}
					/>
				</div>

				{this.props.communityData.admins.sort((foo, bar)=> {
					if (foo.createdAt < bar.createdAt) { return -1; }
					if (foo.createdAt > bar.createdAt) { return 1; }
					return 0;
				}).map((admin)=> {
					return (
						<div key={`admin-${admin.id}`} className="admin-wrapper">
							<div className="avatar-wrapper">
								<a href={`/user/${admin.slug}`}>
									<Avatar width={50} userInitials={admin.initials} userAvatar={admin.avatar} />
								</a>
							</div>

							<div className="content">
								<div className="name">
									<a href={`/user/${admin.slug}`}>
										{admin.fullName}
									</a>
								</div>
							</div>
							<div className="remove-wrapper">
								<button
									type="button"
									className="bp3-button bp3-minimal"
									onClick={()=>{ this.handleAdminRemove(admin.id); }}
								>
									Remove
								</button>
							</div>

						</div>
					);
				})}
			</div>
		);
	}
}

DashboardTeam.propTypes = propTypes;
export default DashboardTeam;
