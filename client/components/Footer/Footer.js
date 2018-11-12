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
			email: '',
			isLoadingSubscribe: false,
			isSubscribed: false
		};
		this.handleEmailChange = this.handleEmailChange.bind(this);
		this.handleEmailSubmit = this.handleEmailSubmit.bind(this);
		this.links = props.isBasePubPub

			? [
				{ id: 1, title: 'Create your community', url: '/create/community' },
				{ id: 2, title: 'Login', url: '/login' },
				{ id: 3, title: 'Signup', url: '/signup' },
				{ id: 4, title: 'Terms', url: '/tos' }
				// { id: 6, title: 'Help', url: 'https://meta.pubpub.org/help' },

			]
			: [
				{ id: 1, title: 'Dashboard', url: '/dashboard', adminOnly: true },
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
		this.setState({
			isLoadingSubscribe: true
		});
		return apiFetch('/api/subscribe', {
			method: 'POST',
			body: JSON.stringify({
				email: this.state.email
			})
		})
		.then(()=> {
			this.setState({
				isLoadingSubscribe: false,
				email: '',
				isSubscribed: true
			});
		})
		.catch((err)=> {
			console.error(err);
			this.setState({
				isLoadingSubscribe: false,
			});
		});
	}

	render() {
		const subscribeButton = (
			<Button icon={!this.state.isSubscribed ? 'arrow-right' : 'tick'} onClick={this.handleEmailSubmit} minimal={true} loading={this.state.isLoadingSubscribe} />
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
									rightElement={subscribeButton}
									disabled={this.state.isSubscribed}
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
