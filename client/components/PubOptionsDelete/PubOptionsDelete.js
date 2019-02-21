import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import InputField from 'components/InputField/InputField';
import { apiFetch } from 'utilities';

require('./pubOptionsDelete.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
};

class PubOptionsDelete extends Component {
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
				window.location.href = '/';
			})
			.catch(() => {
				this.setState({ isLoading: false });
			});
	}

	render() {
		return (
			<div className="pub-options-delete-component">
				<h1>Delete Pub</h1>

				<div className="bp3-callout bp3-intent-danger">
					<p>Deleting a Pub is permanent - it cannot be undone.</p>
					<p>
						This will permanantely delete <b>{this.props.pubData.title}</b>, its
						discussions, versions, and associated metadata.
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
			</div>
		);
	}
}

PubOptionsDelete.propTypes = propTypes;
export default PubOptionsDelete;
