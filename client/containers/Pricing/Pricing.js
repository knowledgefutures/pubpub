import React from 'react';
import PropTypes from 'prop-types';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { hydrateWrapper } from 'utilities';

require('./pricing.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const Pricing = (props)=> {
	return (
		<div id="pricing-container">
			<PageWrapper
				loginData={props.loginData}
				communityData={props.communityData}
				locationData={props.locationData}
				hideNav={true}
			>
				<div className="container">
					<div className="row">
						<div className="col-12">
							<h1>Pricing</h1>
							<p>We are committed to providing PubPub users with robust, free-forever tools to support their community publishing. To fulfill this mission and ensure our sustainability, PubPub offers paid options that we've found to be predominantly required by large publishers.</p>
							<div className="pricing-tiers">
								<div className="option pt-card pt-elevation-1">
									<h2>Community</h2>
									<p className="subtitle">Free, forever</p>
									<ul className="features">
										<li>All of PubPub's core drafting, review, publishing, and discussion features</li>
										<li>Unlimited publications</li>
										<li>Your own pubpub.org subdomain</li>
										<li>Publish with select CC licenses</li>
										<li>E-mail support</li>
										{/* <li>Basic analytics</li>
										<li>Community support</li> */}
									</ul>
									<a href="/community/create" className="pt-button pt-large pt-intent-primary">Create your Community</a>
								</div>
								<div className="option pt-card pt-elevation-1">
									<h2>Professional</h2>
									<p className="subtitle">Available Soon</p>
									<ul className="features">
										<li>All PubPub community features</li>
										<li>Custom domain name</li>
										<li>Publish with any license</li>
										<li>Advanced analytics</li>
										<li>Priority E-mail support</li>
										<li>Multi-community management</li>
										<li>Free archive mode for inactive communities</li>
									</ul>
									<a href="https://mailchi.mp/pubpub/pro" target="_blank" rel="noopener noreferrer" className="pt-button pt-large pt-intent-primary">Join Waiting List</a>
								</div>
								<div className="option pt-card pt-elevation-1">
									<h2>Full Service</h2>
									<p className="subtitle">Contact for pricing</p>
									<ul className="features">
										<li>All PubPub Professional features</li>
										<li>Dedicated, hands-on support for setting up your community</li>
										<li>Production, editorial, marketing, and community management support</li>
									</ul>
									<a href="mailto:team@pubpub.org?subject=Full%20Service%20Inquiry" target="_blank" rel="noopener noreferrer" className="pt-button pt-large pt-intent-primary">Get In Touch</a>
								</div>
							</div>
							<p>Interested in an institutional or enterprise license for your organization? <a href="mailto:team@pubpub.org?subject=Institutional%20License">Get in touch</a>.</p>
						</div>
					</div>
				</div>
			</PageWrapper>
		</div>
	);
};

Pricing.propTypes = propTypes;
export default Pricing;

hydrateWrapper(Pricing);
