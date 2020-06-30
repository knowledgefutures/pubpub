/* eslint-disable jsx-curly-brace-presence */
import React from 'react';
import { Popover, PopoverInteractionKind } from '@blueprintjs/core';
import { GridWrapper } from 'components';

require('./pricing.scss');

const Pricing = () => {
	return (
		<div id="pricing-container">
			<GridWrapper>
				<h1>Pricing</h1>
				<p className="description">
					PubPub's goal is to provide an affordable, high-quality, open-source,
					institution-led, hosted alternative to commercial publishing software. We offer
					a Free tier with no user or publishing limits, as well as a Pro tier for
					individual communities who need more advanced features (or just want to support
					our mission), and an Organization tier for those who need to manage multiple
					communities.
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
							<li>Publish with any Creative Commons license</li>
							<li>
								Up to 10 free DOIs per year ($1 after, or free if you have a
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
						<h2>Pro</h2>
						<p className="subtitle">For individual communities with advanced needs.</p>
						<p className="pricing">
							Monthly or Yearly Fee Per{' '}
							<Popover
								interactionKind={PopoverInteractionKind.HOVER}
								popoverClassName="bp3-popover-content-sizing"
							>
								<em>Seat</em>
								<div>
									<p>
										Seats are calculated as the number of users added to the
										Member tab at the Community or Collection level with
										permissions of edit or above. View-only Members and Members
										added to single Pubs (often used for authors or reviews) are
										free.
									</p>
								</div>
							</Popover>
						</p>
						<ul className="features">
							<li>Everything in the free version, plus:</li>
							<li>Use your own custom domain name</li>
							<li>Publish with custom licenses</li>
							<li>
								Up to 25 free DOIs per year ($1 each after, or free if you have a
								crossref membership).
							</li>
							<li>Initial community setup support</li>
							<li>Priority email support</li>
						</ul>
						<a
							href="mailto:partnerships@pubpub.org?subject=PubPub%20Pro%20Inquiry"
							target="_blank"
							rel="noopener noreferrer"
							className="bp3-button bp3-large bp3-intent-primary"
						>
							Get In Touch
						</a>
					</div>
					<div className="option bp3-card bp3-elevation-1">
						<h2>Organization</h2>
						<p className="subtitle">For managing multiple communities.</p>
						<p className="pricing">
							Monthly or Yearly Fee Per{' '}
							<Popover
								interactionKind={PopoverInteractionKind.HOVER}
								popoverClassName="bp3-popover-content-sizing"
							>
								<em>Seat</em>
								<div>
									<p>
										Seats are calculated as the number of users added to the
										Member tab at the Community or Collection level with
										permissions of edit or above. View-only Members and Members
										added to single Pubs (often used for authors or reviews) are
										free. Members are only counted once across the entire
										organization, no matter how many communities they belong to.
									</p>
								</div>
							</Popover>
						</p>
						<ul className="features">
							<li>Everything in the Pro version, plus:</li>
							<li>Unlimited Communities</li>
							<li>
								Organization Dashboard for managing users, branding, and settings
								across multiple Communities
							</li>
							<li>
								Organization Landing Page for displaying all of the content and
								Communities in your Organization
							</li>
							<li>
								Up to 50 free DOIs per year ($1 each after, or free if you have a
								crossref membership).
							</li>
							<li>Initial organization setup support</li>
							<li>Dedicated email support</li>
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
						Need advanced features, but unsure you can afford PubPub Pro or
						Organization? We offer substantial discounts for small, mission-driven
						communities. For more information,{' '}
						<a href="mailto:partnerships@pubpub.org?subject=Discounts">
							please reach out and tell us about your work and needs
						</a>
						.
					</p>
					<p className="description">
						We also provide article production, community design and setup, interactive
						visualization development, and training workshops for communities of any
						size. If you're interested in these services,{' '}
						<a href="mailto:partnerships@pubpub.org?subject=Additional%20Services">
							please get in touch
						</a>
						.
					</p>
				</div>
			</GridWrapper>
		</div>
	);
};

export default Pricing;
