import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Color from 'color';
import { AnchorButton } from '@blueprintjs/core';

import { getResizedUrl } from 'utils/images';
import { apiFetch } from 'client/utils/apiFetch';

require('./layoutBanner.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	content: PropTypes.object.isRequired,
	/* Expected content */
	/* text, align, backgroundColor, backgroundImage, backgroundSize, backgroundHeight, showButton, buttonType, buttonText, defaultCollectionIds, buttonUrl */
};

class LayoutBanner extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: false,
		};
		this.createPub = this.createPub.bind(this);
	}

	createPub() {
		this.setState({ isLoading: true });
		return apiFetch('/api/pubs', {
			method: 'POST',
			body: JSON.stringify({
				communityId: this.props.communityData.id,
				defaultCollectionIds: this.props.content.defaultCollectionIds,
			}),
		})
			.then((newPub) => {
				window.location.href = `/pub/${newPub.slug}`;
			})
			.catch((err) => {
				console.error(err);
				this.setState({ isLoading: false });
			});
	}

	render() {
		const backgroundImageCss = this.props.content.backgroundImage
			? `url("${getResizedUrl(this.props.content.backgroundImage, 'fit-in', '1500x600')}")`
			: undefined;

		const wrapperStyle = {
			textAlign: this.props.content.align || 'left',
		};
		const textStyle = {
			color:
				this.props.content.backgroundImage ||
				!Color(this.props.content.backgroundColor).isLight()
					? '#FFFFFF'
					: '#000000',
			lineHeight: '1em',
			fontSize: this.props.content.backgroundHeight === 'narrow' ? '18px' : '28px',
		};

		const backgroundStyle = {
			backgroundColor: this.props.content.backgroundColor,
			backgroundImage: backgroundImageCss,
			minHeight: this.props.content.backgroundHeight === 'narrow' ? '60px' : '200px',
			display: 'flex',
			alignItems: 'center',
			maxWidth: 'none',
		};

		const buttonType =
			this.props.content.buttonType || (this.props.content.showButton && 'create-pub');
		const buttonText =
			(buttonType === 'create-pub' && !this.props.loginData.id && 'Login to Create Pub') ||
			this.props.content.buttonText ||
			(buttonType === 'create-pub' && this.props.loginData.id && 'Create Pub') ||
			(buttonType === 'signup' && 'Create an Account') ||
			(buttonType === 'link' && 'Go to Link');
		const buttonUrl =
			(buttonType === 'link' && this.props.content.buttonUrl) ||
			(buttonType === 'create-pub' &&
				!this.props.loginData.id &&
				`/login?redirect=${this.props.locationData.path}`) ||
			(buttonType === 'signup' && '/signup');

		return (
			<div className="layout-banner-component">
				<div
					className="block-content"
					style={
						this.props.content.backgroundSize === 'full' ? backgroundStyle : undefined
					}
				>
					{this.props.content.backgroundImage &&
						this.props.content.backgroundSize === 'full' && <div className="dim" />}
					<div className="container">
						<div
							className="row"
							style={
								this.props.content.backgroundSize === 'standard'
									? backgroundStyle
									: undefined
							}
						>
							{this.props.content.backgroundImage &&
								this.props.content.backgroundSize === 'standard' && (
									<div className="dim" />
								)}
							<div className="col-12" style={wrapperStyle}>
								{this.props.content.text && (
									<h2 style={textStyle}>{this.props.content.text}</h2>
								)}
								{this.props.content.showButton && (
									<AnchorButton
										className="bp3-large"
										onClick={
											buttonType === 'create-pub' &&
											this.props.loginData.id &&
											this.createPub
										}
										loading={this.state.isLoading}
										text={buttonText}
										href={buttonUrl}
									/>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

LayoutBanner.propTypes = propTypes;
export default LayoutBanner;
