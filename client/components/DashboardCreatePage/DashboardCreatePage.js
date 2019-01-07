import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import InputField from 'components/InputField/InputField';
import { apiFetch, slugifyString } from 'utilities';

require('./dashboardCreatePage.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	hostname: PropTypes.string.isRequired,
};

class DashboardCreatePage extends Component {
	constructor(props) {
		super(props);
		this.state = {
			title: '',
			slug: '',
			description: '',
			isLoading: false,
			error: undefined,
		};
		this.handleTitleChange = this.handleTitleChange.bind(this);
		this.handleSlugChange = this.handleSlugChange.bind(this);
		this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
		this.handleCreateSubmit = this.handleCreateSubmit.bind(this);
	}

	handleTitleChange(evt) {
		this.setState({ title: evt.target.value });
	}

	handleSlugChange(evt) {
		this.setState({
			slug: slugifyString(evt.target.value)
		});
	}

	handleDescriptionChange(evt) {
		this.setState({
			description: evt.target.value.substring(0, 280).replace(/\n/g, ' ')
		});
	}

	handleCreateSubmit(evt) {
		evt.preventDefault();

		const pageSlugs = this.props.communityData.pages.map((item)=> {
			return item.slug;
		});
		pageSlugs.push('home');
		if (pageSlugs.indexOf(this.state.slug) > -1) {
			return this.setState({ error: 'URL already used by another Page.' });
		}

		this.setState({ isLoading: true, error: undefined });
		const newPageObject = {
			title: this.state.title,
			slug: this.state.slug,
			description: this.state.description,
			// isPage: this.props.isPage,
		};

		return apiFetch('/api/pages', {
			method: 'POST',
			body: JSON.stringify({
				...newPageObject,
				communityId: this.props.communityData.id,
			})
		})
		.then(()=> {
			this.setState({ isLoading: false, error: undefined });
			window.location.href = `/dashboard/pages/${newPageObject.slug}`;
		})
		.catch((err)=> {
			console.error(err);
			this.setState({ isLoading: false, error: err });
		});
	}

	render() {
		return (
			<div className="dashboard-create-page-component">
				<h1 className="content-title">Create New Page</h1>

				<form onSubmit={this.handleCreateSubmit}>
					<InputField
						label="Page Title"
						placeholder="Brand New Page"
						isRequired={true}
						value={this.state.title}
						onChange={this.handleTitleChange}
					/>
					<InputField
						label="Page URL"
						placeholder="my-page"
						isRequired={true}
						helperText={`${this.props.hostname}/${this.state.slug}`}
						value={this.state.slug}
						onChange={this.handleSlugChange}
					/>
					<InputField
						label="Description"
						isTextarea={true}
						value={this.state.description}
						onChange={this.handleDescriptionChange}
					/>
					<InputField error={this.state.error}>
						<Button
							name="login"
							type="submit"
							className="bp3-button bp3-intent-primary"
							onClick={this.handleCreateSubmit}
							text="Create Page"
							disabled={!this.state.title || !this.state.slug}
							loading={this.state.isLoading}
						/>
					</InputField>
				</form>
			</div>
		);
	}
}

DashboardCreatePage.propTypes = propTypes;
export default DashboardCreatePage;
