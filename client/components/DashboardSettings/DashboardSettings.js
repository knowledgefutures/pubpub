import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup, Button, Tooltip, Switch } from '@blueprintjs/core';
import InputField from 'components/InputField/InputField';
import ImageUpload from 'components/ImageUpload/ImageUpload';
import ColorInput from 'components/ColorInput/ColorInput';
import NavDrag from 'components/NavDrag/NavDrag';
import Header from 'components/Header/Header';
import Icon from 'components/Icon/Icon';
import SettingsSection from 'components/SettingsSection/SettingsSection';
import TagMultiSelect from 'components/TagMultiSelect/TagMultiSelect';
import { populateNavigationIds, apiFetch, slugifyString } from 'utilities';

require('./dashboardSettings.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	setCommunityData: PropTypes.func.isRequired,
};

class DashboardSettings extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: false,
			error: undefined,

			/* Details */
			title: props.communityData.title,
			subdomain: props.communityData.subdomain,
			description: props.communityData.description,
			avatar: props.communityData.avatar,
			favicon: props.communityData.favicon,
			accentColor: props.communityData.accentColor,

			/* Header */
			headerLogo: props.communityData.headerLogo,
			hideCreatePubButton: props.communityData.hideCreatePubButton || false,
			defaultPubTags: props.communityData.defaultPubTags || [],
			// headerLinks

			/* Navigation */
			hideNav: props.communityData.hideNav || false,
			navigation: props.communityData.navigation,

			/* Homepage */
			heroLogo: props.communityData.heroLogo,
			heroBackgroundImage: props.communityData.heroBackgroundImage,
			hideHero: props.communityData.hideHero || false,

			hideHeaderLogo: props.communityData.hideHeaderLogo || false,
			heroBackgroundColor: props.communityData.heroBackgroundColor,
			heroTextColor: props.communityData.heroTextColor,
			useHeaderGradient: props.communityData.useHeaderGradient || false,
			heroImage: props.communityData.heroImage,
			heroTitle: props.communityData.heroTitle,
			heroText: props.communityData.heroText,
			heroPrimaryButton: props.communityData.heroPrimaryButton || {},
			heroSecondaryButton: props.communityData.heroSecondaryButton || {},
			heroAlign: props.communityData.heroAlign || 'left',

			/* Social */
			website: props.communityData.website || '',
			twitter: props.communityData.twitter || '',
			facebook: props.communityData.facebook || '',
			email: props.communityData.email || '',
		};

		this.handleSaveClick = this.handleSaveClick.bind(this);
	}

	handleSaveClick(evt) {
		evt.preventDefault();
		const siteObject = {
			...this.state,
			isLoading: undefined,
			error: undefined,
		};

		this.setState({ isLoading: true, error: undefined });
		return apiFetch('/api/communities', {
			method: 'PUT',
			body: JSON.stringify({
				...siteObject,
				communityId: this.props.communityData.id,
			}),
		})
			.then((result) => {
				if (
					!this.props.communityData.domain &&
					this.props.communityData.slug !== siteObject.slug
				) {
					window.location.replace(
						`https://${siteObject.subdomain}.pubpub.org/dashboard/details`,
					);
				} else {
					this.setState({ isLoading: false, error: undefined });
					this.props.setCommunityData({
						...this.props.communityData,
						...result,
					});
				}
			})
			.catch((err) => {
				console.error(err);
				this.setState({ isLoading: false, error: err });
			});
	}

	render() {
		const pages = this.props.communityData.pages || [];
		const navigation = this.props.communityData.navigation || [];
		const initialNav = populateNavigationIds(pages, navigation);
		const heroTextColor = this.state.heroTextColor || this.props.communityData.accentTextColor;

		return (
			<div className="dashboard-settings-component">
				<div className="content-buttons">
					<InputField error={this.state.error}>
						<Button
							name="create"
							type="submit"
							className="bp3-button bp3-intent-primary save-community-button"
							onClick={this.handleSaveClick}
							text="Save Settings"
							disabled={!this.state.title || !this.state.subdomain}
							loading={this.state.isLoading}
						/>
					</InputField>
				</div>
				<h1 className="content-title">Settings</h1>
				<SettingsSection title="Details">
					<InputField
						label="Title"
						type="text"
						isRequired={true}
						value={this.state.title}
						onChange={(evt) => {
							this.setState({ title: evt.target.value });
						}}
					/>
					<InputField
						label="Domain"
						type="text"
						isRequired={true}
						value={this.state.subdomain}
						onChange={(evt) => {
							this.setState({ subdomain: slugifyString(evt.target.value) });
						}}
					/>
					<InputField
						label="Description"
						type="text"
						isTextarea={true}
						value={this.state.description}
						onChange={(evt) => {
							this.setState({
								description: evt.target.value.substring(0, 280).replace(/\n/g, ' '),
							});
						}}
					/>
					<div className="row-wrapper">
						<ImageUpload
							htmlFor="favicon-upload"
							label={
								<span>
									Favicon
									<Tooltip
										content={
											<span>
												Used for browser icons. Must be square.
												<br />
												Recommended: 50*50px
											</span>
										}
										tooltipClassName="bp3-dark"
									>
										<Icon icon="info-sign" />
									</Tooltip>
								</span>
							}
							defaultImage={this.state.favicon}
							onNewImage={(val) => {
								this.setState({ favicon: val });
							}}
						/>
						<ImageUpload
							htmlFor="avatar-upload"
							label={
								<span>
									Preview
									<Tooltip
										content={
											<span>
												Used as default preview image for social sharing
												cards.
												<br />
												Recommended: 500*500px
											</span>
										}
										tooltipClassName="bp3-dark"
									>
										<Icon icon="info-sign" />
									</Tooltip>
								</span>
							}
							defaultImage={this.state.avatar}
							onNewImage={(val) => {
								this.setState({ avatar: val });
							}}
						/>
					</div>
					<InputField label="Accent Color">
						<ColorInput
							value={this.state.accentColor}
							onChange={(val) => {
								this.setState({ accentColor: val.hex });
							}}
						/>
					</InputField>
				</SettingsSection>
				<SettingsSection title="Header">
					<ImageUpload
						htmlFor="header-logo-upload"
						label={
							<span>
								Header Logo
								<Tooltip
									content={
										<span>
											Used in the header bar.
											<br />
											Recommended: ~40*150px
										</span>
									}
									tooltipClassName="bp3-dark"
								>
									<Icon icon="info-sign" />
								</Tooltip>
							</span>
						}
						defaultImage={this.state.headerLogo}
						height={80}
						width={150}
						onNewImage={(val) => {
							this.setState({ headerLogo: val });
						}}
						useAccentBackground={true}
						canClear={true}
					/>
					<InputField>
						<Switch
							label={
								<span>
									Public &apos;New Pub&apos; button
									<Tooltip
										content={
											<span>
												Toggles &apos;New Pub&apos; button in header bar.
												<br />
												Button will always be available to community admins.
											</span>
										}
										tooltipClassName="bp3-dark"
									>
										<Icon icon="info-sign" />
									</Tooltip>
								</span>
							}
							checked={!this.state.hideCreatePubButton}
							onChange={(evt) => {
								this.setState({ hideCreatePubButton: !evt.target.checked });
							}}
						/>
					</InputField>
					<InputField
						label="Default 'New Pub' Tag"
						wrapperClassName={this.state.hideCreatePubButton ? 'disable-block' : ''}
					>
						<TagMultiSelect
							allTags={this.props.communityData.tags}
							selectedTagIds={this.state.defaultPubTags || []}
							onItemSelect={(newTagId) => {
								const existingTagIds = this.state.defaultPubTags || [];
								const newTagIds = [...existingTagIds, newTagId];
								this.setState({ defaultPubTags: newTagIds });
							}}
							onRemove={(evt, tagIndex) => {
								const existingTagIds = this.state.defaultPubTags || [];
								const newTagIds = existingTagIds.filter((item, filterIndex) => {
									return filterIndex !== tagIndex;
								});
								this.setState({ defaultPubTags: newTagIds });
							}}
							placeholder="Select Tags..."
						/>
					</InputField>
				</SettingsSection>
				<SettingsSection title="Navigation">
					<InputField>
						<Switch
							large={true}
							label="Show Navigation Bar"
							checked={!this.state.hideNav}
							onChange={(evt) => {
								this.setState({ hideNav: !evt.target.checked });
							}}
						/>
					</InputField>
					<div className={this.state.hideNav ? 'disable-block' : ''}>
						<InputField label="Navigation">
							<NavDrag
								initialNav={initialNav}
								pages={pages}
								onChange={(val) => {
									this.setState({ navigation: val });
								}}
							/>
						</InputField>
					</div>
				</SettingsSection>
				<SettingsSection title="Homepage">
					<div className="row-wrapper">
						<InputField>
							<Switch
								large={true}
								label="Show Homepage Banner"
								checked={!this.state.hideHero}
								onChange={(evt) => {
									this.setState({ hideHero: !evt.target.checked });
								}}
							/>
						</InputField>
					</div>
					<div className={this.state.hideHero ? 'disable-block' : ''}>
						<div className="row-wrapper">
							<ImageUpload
								htmlFor="hero-logo-upload"
								label={
									<span>
										Banner Logo
										<Tooltip
											content={
												<span>
													Used on the landing page.
													<br />
													Recommended: ~200*750px
												</span>
											}
											tooltipClassName="bp3-dark"
										>
											<Icon icon="info-sign" />
										</Tooltip>
									</span>
								}
								defaultImage={this.state.heroLogo}
								height={80}
								width={150}
								onNewImage={(val) => {
									this.setState({ heroLogo: val });
								}}
								useAccentBackground={true}
								canClear={true}
							/>
							<ImageUpload
								htmlFor="hero-background-upload"
								label={
									<span>
										Banner Background
										<Tooltip
											content={
												<span>
													Used on the landing page.
													<br />
													Recommended: ~1200*800px
												</span>
											}
											tooltipClassName="bp3-dark"
										>
											<Icon icon="info-sign" />
										</Tooltip>
									</span>
								}
								defaultImage={this.state.heroBackgroundImage}
								onNewImage={(val) => {
									this.setState({ heroBackgroundImage: val });
								}}
								height={80}
								width={150}
								canClear={true}
							/>
							<ImageUpload
								htmlFor="hero-image-upload"
								label={
									<span>
										Banner Image
										<Tooltip
											content={
												<span>
													Used on the landing page.
													<br />
													Recommended: ~600*600px
												</span>
											}
											tooltipClassName="bp3-dark"
										>
											<Icon icon="info-sign" />
										</Tooltip>
									</span>
								}
								defaultImage={this.state.heroImage}
								onNewImage={(val) => {
									this.setState({ heroImage: val });
								}}
								height={80}
								width={150}
								canClear={true}
							/>
						</div>
						<InputField
							label="Banner Title"
							type="text"
							value={this.state.heroTitle}
							onChange={(evt) => {
								this.setState({ heroTitle: evt.target.value });
							}}
						/>
						<InputField
							label="Banner Text"
							type="text"
							value={this.state.heroText}
							onChange={(evt) => {
								this.setState({ heroText: evt.target.value });
							}}
						/>

						<div className="row-wrapper">
							<InputField>
								<Switch
									label="Hide Header Logo"
									checked={this.state.hideHeaderLogo}
									onChange={(evt) => {
										this.setState({ hideHeaderLogo: evt.target.checked });
									}}
								/>
							</InputField>
							<InputField>
								<Switch
									label="Use Header Gradient"
									checked={this.state.useHeaderGradient}
									onChange={(evt) => {
										this.setState({ useHeaderGradient: evt.target.checked });
									}}
									disabled={!this.state.heroBackgroundImage}
								/>
							</InputField>
						</div>
						<div className="row-wrapper">
							<InputField label="Banner Background Color">
								<ColorInput
									value={this.state.heroBackgroundColor || this.state.accentColor}
									onChange={(val) => {
										this.setState({ heroBackgroundColor: val.hex });
									}}
								/>
							</InputField>
							<InputField label="Banner Text Color">
								<ButtonGroup>
									<Button
										text="Light"
										active={heroTextColor === '#FFFFFF'}
										onClick={() => {
											this.setState({ heroTextColor: '#FFFFFF' });
										}}
									/>
									<Button
										text="Dark"
										active={heroTextColor === '#000000'}
										onClick={() => {
											this.setState({ heroTextColor: '#000000' });
										}}
									/>
								</ButtonGroup>
							</InputField>
						</div>

						<div className="row-wrapper">
							<InputField
								label="Primary Button Text"
								type="text"
								value={this.state.heroPrimaryButton.title}
								onChange={(evt) => {
									const val = evt.target.value;
									this.setState((prevState) => {
										return {
											heroPrimaryButton: {
												title: val,
												url: prevState.heroPrimaryButton.url,
											},
										};
									});
								}}
							/>
							<InputField
								label="Primary Button URL"
								type="text"
								value={this.state.heroPrimaryButton.url}
								onChange={(evt) => {
									const val = evt.target.value;
									this.setState((prevState) => {
										return {
											heroPrimaryButton: {
												title: prevState.heroPrimaryButton.title,
												url: val,
											},
										};
									});
								}}
							/>
						</div>
						<div className="row-wrapper">
							<InputField
								label="Secondary Button Text"
								type="text"
								value={this.state.heroSecondaryButton.title}
								onChange={(evt) => {
									const val = evt.target.value;
									this.setState((prevState) => {
										return {
											heroSecondaryButton: {
												title: val,
												url: prevState.heroSecondaryButton.url,
											},
										};
									});
								}}
							/>
							<InputField
								label="Secondary Button URL"
								type="text"
								value={this.state.heroSecondaryButton.url}
								onChange={(evt) => {
									const val = evt.target.value;
									this.setState((prevState) => {
										return {
											heroSecondaryButton: {
												title: prevState.heroSecondaryButton.title,
												url: val,
											},
										};
									});
								}}
							/>
						</div>

						<InputField label="Banner Align">
							<ButtonGroup>
								<Button
									text="Left"
									active={this.state.heroAlign === 'left'}
									onClick={() => {
										this.setState({ heroAlign: 'left' });
									}}
								/>
								<Button
									text="Center"
									active={this.state.heroAlign === 'center'}
									onClick={() => {
										this.setState({ heroAlign: 'center' });
									}}
								/>
							</ButtonGroup>
						</InputField>
					</div>
					<InputField label="Preview">
						<Header
							communityData={{
								...this.props.communityData,
								...this.state,
							}}
							locationData={{
								path: '/',
								queryString: '',
								params: {},
							}}
							loginData={{}}
						/>
					</InputField>
				</SettingsSection>
				<SettingsSection title="Social">
					<InputField
						label="Website"
						type="text"
						value={this.state.website}
						onChange={(evt) => {
							this.setState({ website: evt.target.value });
						}}
					/>
					<InputField
						label="Twitter"
						type="text"
						value={this.state.twitter}
						helperText={`https://twitter.com/${this.state.twitter}`}
						onChange={(evt) => {
							this.setState({ twitter: evt.target.value });
						}}
					/>
					<InputField
						label="Facebook"
						type="text"
						value={this.state.facebook}
						helperText={`https://facebook.com/${this.state.facebook}`}
						onChange={(evt) => {
							this.setState({ facebook: evt.target.value });
						}}
					/>
					<InputField
						label="Contact Email"
						type="text"
						value={this.state.email}
						onChange={(evt) => {
							this.setState({ email: evt.target.value });
						}}
					/>
				</SettingsSection>
			</div>
		);
	}
}

DashboardSettings.propTypes = propTypes;
export default DashboardSettings;
