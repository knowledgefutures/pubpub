import React from 'react';
import { GridWrapper } from 'components';

require('./pricing.scss');

const Pricing = () => {
	return (
		<div id="pricing-container">
			<GridWrapper>
				<h1>
					Simple Pricing
					<br />
					to Support Nonprofit Infrastructure
				</h1>
				<p className="description top">
					PubPub's goal is to provide an affordable, high-quality, open-source,
					institution-led, hosted non-profit publishing software. We offer plans with no
					user or publishing limits for everyone from individual communities to larger
					organizations.
				</p>
				<div className="pricing-tiers">
					<div className="option bp3-card bp3-elevation-1" id="independent">
						<h2>Independent</h2>
						<p className="subtitle">
							For individuals, grassroots communities, and experimenters.
						</p>
						<h3 className="pricing">
							Contribute What You Want
							<br />
							<span className="subhead">(including $0!)</span>
						</h3>
						<a
							href="/community/create"
							className="bp3-button bp3-large bp3-intent-primary"
						>
							Create your Community
						</a>
						<ul className="features">
							<li>Single PubPub Community</li>
							<li>Forum-Based support</li>
							<li>Unlimited Pubs and Users</li>
							<li>Creative Commons Licenses</li>
							<li>Dedicated pubpub.org subdomain</li>
							<li>Custom domain available with contributions over $5/month</li>
							<li>
								10 free DOIs per year<span className="star">*</span>
							</li>
						</ul>
					</div>
					<div className="option bp3-card bp3-elevation-1" id="starter">
						<h2>
							Starter <span className="subhead">(beta)</span>
						</h2>
						<p className="subtitle">
							For smaller, independent, and unconventional publishers.
						</p>
						<h3 className="pricing">
							$175<span className="subhead">/month</span>
						</h3>
						<a
							href="mailto:partnerships@pubpub.org?subject=PubPub%20Starter%20Inquiry"
							target="_blank"
							rel="noopener noreferrer"
							className="bp3-button bp3-large bp3-intent-primary"
						>
							Get In Touch
						</a>
						<ul className="features">
							<li>Up to 5 Communities</li>
							<li>Email support</li>
							<li>Unlimited Pubs and Users</li>
							<li>Custom licenses</li>
							<li>Dedicated pubpub.org subdomain</li>
							<li>Custom domains</li>
							<li>
								25 free DOIs per year<span className="star">*</span>
							</li>
						</ul>
					</div>
					<div className="option bp3-card bp3-elevation-1" id="pro">
						<h2>
							Pro <span className="subhead">(beta)</span>
						</h2>
						<p className="subtitle">For larger publishers with professional needs.</p>
						<h3 className="pricing">
							$425<span className="subhead">/month</span>
						</h3>
						<a
							href="mailto:partnerships@pubpub.org?subject=PubPub%20Pro%20Inquiry"
							target="_blank"
							rel="noopener noreferrer"
							className="bp3-button bp3-large bp3-intent-primary"
						>
							Get In Touch
						</a>
						<ul className="features">
							<li>Up to 15 Communities</li>
							<li>Priority email support</li>
							<li>Unlimited Pubs and Users</li>
							<li>Custom licenses</li>
							<li>Dedicated pubpub.org subdomain</li>
							<li>Custom domains</li>
							<li>
								50 free DOIs per year<span className="star">*</span>
							</li>
						</ul>
					</div>
					<div className="option bp3-card bp3-elevation-1" id="enterprise">
						<h2>Enterprise</h2>
						<p className="subtitle">
							For institutions & organizations who need custom support & scale.
						</p>
						<h3 className="pricing">Custom</h3>
						<a
							href="mailto:partnerships@pubpub.org?subject=PubPub%20Enterprise%20Inquiry"
							target="_blank"
							rel="noopener noreferrer"
							className="bp3-button bp3-large bp3-intent-primary"
						>
							Get In Touch
						</a>
						<ul className="features">
							<li>Custom # of Communities</li>
							<li>Dedicated email support</li>
							<li>Unlimited Pubs and Users</li>
							<li>Custom licenses</li>
							<li>Dedicated pubpub.org subdomain</li>
							<li>Custom domains</li>
							<li>Custom # of DOIs</li>
						</ul>
					</div>
				</div>
				<div className="pricing-footer">
					<p className="description">
						Our plans are based on the cost savings PubPub offers publishing communities
						and the cost of providing support for Communities and Organizations as they
						scale. We developed our plans in partnership with our Communities with the
						goal of making PubPub sustainable without excluding Communities or punishing
						them for success.{' '}
						<a href="https://notes.knowledgefutures.org/pub/ik8lltas">
							Read more about the thinking behind our plans
						</a>
						.
					</p>
					<p className="description">
						Need advanced features, but unsure you can afford our plans? We offer
						substantial discounts for small, mission-driven communities. For more
						information,{' '}
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

					<p className="description">
						* The free DOI limit applies to DOIs published via PubPub's Crossref
						membership. Once the limit is reached, PubPub passes on the Crossref fee of
						$1 per DOI registered to the Community. For Communities with their own
						Crossref membership, there is no additional fee for creating or depositing
						DOIs.
					</p>
				</div>
			</GridWrapper>
		</div>
	);
};

export default Pricing;
