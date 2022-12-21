import React, { Component } from 'react';
import Color from 'color';
import { AnchorButton, Classes, Tooltip } from '@blueprintjs/core';

import { getResizedUrl } from 'utils/images';
import { apiFetch } from 'client/utils/apiFetch';

require('./layoutBanner.scss');

type Props = {
	communityData: any;
	loginData: any;
	locationData: any;
	content: any;
};

type State = any;

export const getButtonText = (
	buttonType: 'create-pub' | 'signup' | 'link' | null,
	customButtonText: string,
	isLoggedIn = true,
): string | undefined => {
	if (!isLoggedIn && buttonType === 'create-pub') return 'Login to Create Pub';
	if (customButtonText) return customButtonText;
	if (isLoggedIn && buttonType === 'create-pub') return 'Create Pub';
	if (buttonType === 'signup') return 'Create an Account';
	if (buttonType === 'link') return 'Go to Link';
	return undefined;
};

const createPubFailureText =
	'Error creating a new Pub. You may want to refresh the page and try again.';

class LayoutBanner extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			isLoading: false,
			buttonError: null,
		};
		this.createPub = this.createPub.bind(this);
	}

	createPub() {
		const { communityData, content } = this.props;
		this.setState({ isLoading: true, buttonError: null });
		return apiFetch('/api/pubs', {
			method: 'POST',
			body: JSON.stringify({
				communityId: communityData.id,
				createPubToken: content.createPubToken,
			}),
		})
			.then((newPub) => {
				window.location.href = `/pub/${newPub.slug}`;
				this.setState({ isLoading: false });
			})
			.catch((err) => {
				console.error(err);
				this.setState({ isLoading: false, buttonError: createPubFailureText });
			});
	}

	renderButton() {
		const { buttonError } = this.state;
		const isLoggedIn = !!this.props.loginData.id;

		if (!this.props.content.showButton) {
			return null;
		}

		const buttonType =
			this.props.content.buttonType || (this.props.content.showButton && 'create-pub');

		const buttonText = getButtonText(buttonType, this.props.content.buttonText, isLoggedIn);

		let buttonUrl;
		if (buttonType === 'link') {
			buttonUrl = this.props.content.buttonUrl;
		} else if (!isLoggedIn && buttonType === 'create-pub') {
			buttonUrl = `/login?redirect=${this.props.locationData.path}`;
		} else if (buttonType === 'signup') {
			buttonUrl = 'signup';
		}

		const onButtonClick =
			(isLoggedIn && buttonType === 'create-pub' && this.createPub) || undefined;

		const button = (
			<AnchorButton
				className={Classes.LARGE}
				onClick={onButtonClick}
				loading={this.state.isLoading}
				text={buttonText}
				href={buttonUrl}
			/>
		);

		return buttonError ? (
			<Tooltip content={buttonError} defaultIsOpen={true}>
				{button}
			</Tooltip>
		) : (
			button
		);
	}

	render() {
		const backgroundImageCss = this.props.content.backgroundImage
			? `url("${getResizedUrl(this.props.content.backgroundImage, 'inside', 1500, 600)}")`
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
								{this.renderButton()}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
export default LayoutBanner;
