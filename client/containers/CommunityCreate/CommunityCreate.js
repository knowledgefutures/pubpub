import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, NonIdealState } from '@blueprintjs/core';
import InputField from 'components/InputField/InputField';
import ImageUpload from 'components/ImageUpload/ImageUpload';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { hydrateWrapper, apiFetch } from 'utilities';

require('./communityCreate.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

class CommunityCreate extends Component {
	constructor(props) {
		super(props);
		this.state = {
			subdomain: '',
			title: '',
			description: '',
			largeHeaderLogo: '',
			accentColor: '#2D2E2F',
			createIsLoading: false,
			createError: undefined,
		};
		this.onCreateSubmit = this.onCreateSubmit.bind(this);
		this.onSubdomainChange = this.onSubdomainChange.bind(this);
		this.onTitleChange = this.onTitleChange.bind(this);
		this.onDescriptionChange = this.onDescriptionChange.bind(this);
		this.onLargeHeaderLogoChange = this.onLargeHeaderLogoChange.bind(this);
		this.onAccentColorChange = this.onAccentColorChange.bind(this);
	}

	onCreateSubmit(evt) {
		evt.preventDefault();

		this.setState({ createIsLoading: true, createError: undefined });
		return apiFetch('/api/communities', {
			method: 'POST',
			body: JSON.stringify({
				subdomain: this.state.subdomain,
				title: this.state.title,
				description: this.state.description,
				smallHeaderLogo: this.state.largeHeaderLogo,
				largeHeaderLogo: this.state.largeHeaderLogo,
				accentColor: this.state.accentColor,
			})
		})
		.then(()=> {
			this.setState({ createIsLoading: false, createError: undefined });
			window.location.href = `https://${this.state.subdomain}.pubpub.org`;
		})
		.catch((err)=> {
			this.setState({ createIsLoading: false, createError: err });
		});
	}

	onSubdomainChange(evt) {
		this.setState({ subdomain: evt.target.value.replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/gi, '').toLowerCase() });
	}

	onTitleChange(evt) {
		this.setState({ title: evt.target.value });
	}

	onDescriptionChange(evt) {
		this.setState({ description: evt.target.value.substring(0, 280).replace(/\n/g, ' ') });
	}

	onLargeHeaderLogoChange(val) {
		this.setState({ largeHeaderLogo: val });
	}

	onAccentColorChange(evt) {
		this.setState({ accentColor: evt.target.value });
	}

	render() {
		const colorRegex = /^#([a-f]|[A-F]|[0-9]){6}$/;
		return (
			<div id="community-create-container">
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
					hideNav={true}
					hideFooter={true}
				>
					<div className="container small">
						<div className="row">
							<div className="col-12">
								{!this.props.loginData.id &&
									<NonIdealState
										title="To create your community, create an account or login."
										visual="error"
										action={<a href="/login?redirect=/community/create" className="pt-button">Login or Signup</a>}
									/>
								}
								{this.props.loginData.id &&
									<div>
										<h1>Create Community</h1>
										<form onSubmit={this.onCreateSubmit}>
											<InputField
												label="URL"
												isRequired={true}
												value={this.state.subdomain}
												onChange={this.onSubdomainChange}
												helperText={`https://${this.state.subdomain || '[URL]'}.pubpub.org`}
											/>
											<InputField
												label="Title"
												isRequired={true}
												value={this.state.title}
												onChange={this.onTitleChange}
											/>
											<InputField
												label="Description"
												isTextarea={true}
												value={this.state.description}
												onChange={this.onDescriptionChange}
												helperText={`${this.state.description.length}/280 characters`}
											/>
											<ImageUpload
												htmlFor="large-header-logo-upload"
												label="Community Logo"
												defaultImage={this.state.largeHeaderLogo}
												height={60}
												width={150}
												onNewImage={this.onLargeHeaderLogoChange}
												helperText="Used on the landing page. Suggested height: 200px"
											/>
											<InputField
												label="Accent Color"
												isRequired={true}
												value={this.state.accentColor}
												onChange={this.onAccentColorChange}
												error={!colorRegex.test(this.state.accentColor) ? 'Must be a hex format color: e.g. #123456' : ''}
												helperText={<div className="color-swatch" style={{ backgroundColor: this.state.accentColor }} />}
											/>
											<InputField error={this.state.createError}>
												<Button
													name="create"
													type="submit"
													className="pt-button pt-intent-primary create-account-button"
													onClick={this.onCreateSubmit}
													text="Create Community"
													disabled={!this.state.subdomain || !this.state.title || !colorRegex.test(this.state.accentColor)}
													loading={this.state.createIsLoading}
												/>
											</InputField>
										</form>
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

CommunityCreate.propTypes = propTypes;
export default CommunityCreate;

hydrateWrapper(CommunityCreate);
