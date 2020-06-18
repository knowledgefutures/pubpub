import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { InputField } from 'components';
import { getDashUrl } from 'utils/dashboard';
import { apiFetch } from 'client/utils/apiFetch';

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
};

class DeletePub extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: false,
			title: '',
		};
		this.updateTitle = this.updateTitle.bind(this);
		this.handleDelete = this.handleDelete.bind(this);
	}

	updateTitle(evt) {
		this.setState({
			title: evt.target.value,
		});
	}

	handleDelete() {
		this.setState({ isLoading: true });
		return apiFetch('/api/pubs', {
			method: 'DELETE',
			body: JSON.stringify({
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
			}),
		})
			.then(() => {
				window.location.href = getDashUrl({ mode: 'overview' });
			})
			.catch(() => {
				this.setState({ isLoading: false });
			});
	}

	render() {
		return (
			<div className="bp3-callout bp3-intent-danger">
				<p>
					<b>Deleting a Pub is permanent - it cannot be undone.</b>
				</p>
				<p>
					This will permanantely delete the pub <b>{this.props.pubData.title}</b>, its
					discussions, branches, and associated metadata.
				</p>
				<p>Please type the title of the Pub below to confirm your intention.</p>

				<InputField
					label={<b>Confirm Pub Title</b>}
					value={this.state.title}
					onChange={this.updateTitle}
				/>

				<Button
					type="button"
					className="bp3-intent-danger"
					text="Delete Pub"
					loading={this.state.isLoading}
					onClick={this.handleDelete}
					disabled={this.props.pubData.title !== this.state.title}
				/>
			</div>
		);
	}
}

DeletePub.propTypes = propTypes;
export default DeletePub;
