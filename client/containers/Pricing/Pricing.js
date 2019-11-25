/* eslint-disable jsx-curly-brace-presence */
import React from 'react';
import PropTypes from 'prop-types';

import { Popover, PopoverInteractionKind } from '@blueprintjs/core';
import { GridWrapper, PageWrapper } from 'components';
import { hydrateWrapper } from 'utils';

require('./pricing.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

const Pricing = (props) => {
	return (
		<div id="pricing-container">
			<PageWrapper
				loginData={props.loginData}
				communityData={props.communityData}
				locationData={props.locationData}
				hideNav={true}
				hideFooter={true}
			>
				<GridWrapper>
					<h1>Pricing</h1>
					<p className="description">
						PubPub's goal is to provide a high-quality, open-source, institution-owned,
						hosted alternative to commercial publishing software. We offer a Free tier
						with no user or publishing limits, as well as an Organization tier for those
						who need more advanced features (or just want to support our mission).
					</p>
					<div className="pricing-tiers">
						<div className="option bp3-card bp3-elevation-1">
							<h2>Free</h2>
							<p className="subtitle">For publishing communities of all kinds.</p>
							<p className="pricing">Free, Forever</p>
							<ul className="features">
								<li>
									All of PubPub&apos;s core drafting, review, publishing, and
									discussion features
								</li>
								<li>Your own pubpub.org subdomain</li>
								<li>Unlimited publications</li>
								<li>Unlimited users</li>
								<li>Custom site design</li>
								<li>
									Up to 25 free DOIs per year ($1 after, or free if you have a
									crossref membership)
								</li>
								<li>
									Community support on our{' '}
									<a
										href="https://discourse.knowledgefutures.org"
										target="_blank"
										rel="noopener noreferrer"
									>
										Discourse forums
									</a>
								</li>
							</ul>
							<a
								href="/community/create"
								className="bp3-button bp3-large bp3-intent-primary"
							>
								Create your Community
							</a>
						</div>
						<div className="option bp3-card bp3-elevation-1">
							<h2>Organization</h2>
							<p className="subtitle">For communities with advanced needs.</p>
							<p className="pricing">
								Flat Yearly Fee Per{' '}
								<Popover
									interactionKind={PopoverInteractionKind.HOVER}
									popoverClassName="bp3-popover-content-sizing"
								>
									<em>Active Community</em>
									<div>
										<p>
											Active years are calculated as any year in which one or
											more new Pubs have been added to the Community. In
											non-active years, communities are hosted for free.
											Organization plans include a 3-month grace period
											before ‘active’ status is calculated, allowing
											organizations to experiment and create short-lived
											communities for events and conferences at no additional
											cost.
										</p>
									</div>
								</Popover>
							</p>
							<ul className="features">
								<li>Everything in the free version, plus:</li>
								<li>Use your own custom domain name</li>
								<li>Custom PDF export design</li>
								<li>
									Organization Dashboard for managing users, branding, and
									settings across multiple Communities
								</li>
								<li>
									Organization Landing Page for displaying all of the content and
									Communities in your organization
								</li>
								<li>
									3-month grace period for new Communities for experiments and
									short-lived conferences and events.
								</li>
								<li>
									Up to 100 free DOIs per community per year ($1 each after, or
									free if you have a crossref membership).
								</li>
								<li>Initial organization setup support</li>
								<li>Priority email support</li>
							</ul>
							<a
								href="mailto:partnerships@pubpub.org?subject=PubPub%20Org%20Inquiry"
								target="_blank"
								rel="noopener noreferrer"
								className="bp3-button bp3-large bp3-intent-primary"
							>
								Get In Touch
							</a>
						</div>
					</div>
					<div className="pricing-footer">
						<p className="description">
							Need advanced features, but unsure you can afford PubPub Organization?
							We offer substantial discounts for small, mission-driven communities.
							information,{' '}
							<a href="mailto:partnerships@pubpub.org?subject=Discounts">
								please reach out
							</a>
							.
						</p>
						<p className="description">
							We also provide article production, community design and setup,
							interactive visualization development, and training workshops for
							communities of any size. If you're interested in these services,{' '}
							<a href="mailto:partnerships@pubpub.org?subject=Additional%20Services">
								please get in touch
							</a>
							.
						</p>
					</div>
				</GridWrapper>
			</PageWrapper>
		</div>
	);
};

Pricing.propTypes = propTypes;
export default Pricing;

hydrateWrapper(Pricing);
