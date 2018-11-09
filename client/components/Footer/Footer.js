import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, InputGroup } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';
import { apiFetch } from 'utilities';

require('./footer.scss');

const propTypes = {
	isBasePubPub: PropTypes.bool.isRequired,
	isAdmin: PropTypes.bool.isRequired,
	communityTitle: PropTypes.bool.isRequired,
	socialItems: PropTypes.array.isRequired,
};

class Footer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			email: ''
		};
		this.handleEmailChange = this.handleEmailChange.bind(this);
		this.handleEmailSubmit = this.handleEmailSubmit.bind(this);
		this.links = props.isBasePubPub

			? [
				{ id: 1, title: 'Pricing', url: '/pricing' },
				{ id: 2, title: 'Terms', url: '/tos' },
				// { id: 6, title: 'Help', url: 'https://meta.pubpub.org/help' },

			]
			: [
				{ id: 1, title: 'Dashboard', url: '/dashboard', adminOnly: true },
				...props.socialItems,
				{ id: 2, title: 'RSS', url: '/rss.xml' },
				{ id: 3, title: 'Terms', url: '/tos' },
				// { id: 6, title: 'Help', url: 'https://meta.pubpub.org/help' },
			];

		this.wrapperClasses = props.isBasePubPub
			? 'base-pubpub'
			: 'accent-background accent-color';
	}

	handleEmailChange(evt) {
		this.setState({ email: evt.target.value });
	}

	handleEmailSubmit(evt) {
		evt.preventDefault();
		return apiFetch('/api/subscribe', {
			method: 'POST',
			body: JSON.stringify({
				email: this.state.email
			})
		})
		.then((result)=> {
			console.log(result);
		})
		.catch((err)=> {
			console.error(err);
		});
	}

	render() {
		const arrowButton = (
			<Button icon="arrow-right" onClick={this.handleEmailSubmit} minimal={true} />
		);
		return (
			<div className={`footer-component ${this.wrapperClasses}`}>
				<div className="container">
					<div className="row">
						<div className="col-3">
							<a href="https://pubpub.org"><img className="logo" src="/static/logoWhite.svg" alt="PubPub logo" /></a>
							<ul className="social-list">
								<li><a href="https://twitter.com/pubpub"><Icon icon="twitter" /></a></li>
								<li><a href="mailto:team@pubpub.org?subject=Contact"><Icon icon="envelope" /></a></li>
								<li><a href="https://github.com/pubpub"><Icon icon="github" /></a></li>
							</ul>
							<p><strong>Feature & community updates</strong></p>
							<form onSubmit={this.handleEmailSubmit}>
								<InputGroup
									placeholder="Your Email"
									value={this.state.email}
									onChange={this.handleEmailChange}
									rightElement={arrowButton}
								/>
							</form>
						</div>
						<div className="col-2">
							<ul>
								<li><strong>Product</strong></li>
								<li><a href="https://pubpub.org/about">About PubPub</a></li>
								<li><a href="https://pubpub.org/explore">Explore Communities</a></li>
								<li><a href="https://pubpub.org/pricing">Pricing</a></li>
								<li><a href="https://help.pubpub.org">Help</a></li>
							</ul>
						</div>
						<div className="col-5">&nbsp;</div>
						<div className="col-2">
							<ul>
								<li><a href="/"><strong>{this.props.communityTitle}</strong></a></li>
								{this.links.filter((item)=> {
									return !item.adminOnly || this.props.isAdmin;
								}).map((link)=> {
									return (
										<li key={`footer-item-${link.id}`}>
											<a href={link.url}>
												{link.title}
											</a>
										</li>
									);
								})}
							</ul>
							{!!this.props.socialItems.length &&
								<ul className="social-list">
									{this.props.socialItems.map((item)=> {
										return (
											<a href={item.url} key={`social-item-${item.id}`}>
												<li>
													{item.icon}
												</li>
											</a>
										);
									})}
								</ul>
							}
						</div>
					</div>
				</div>
			</div>
		);
	}
}

Footer.propTypes = propTypes;
export default Footer;
