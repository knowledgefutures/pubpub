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
							<li>Forum-based support</li>
							<li>Unlimited Pubs and Users</li>
							<li>Creative Commons Licenses</li>
							<li>Dedicated pubpub.org subdomain</li>
							<li>Custom domain available with contributions over $5/month</li>
							<li>
								10 free DOIs per year<span className="star">*</span>
							</li>
						</ul>
					</div>
					<div className="option bp3-card bp3-elevation-1" id="enterprise">
						<h2>Custom</h2>
						<p className="subtitle">
							For institutions & organizations who need custom support & scale.
						</p>
						<h3 className="pricing">Custom Quote</h3>
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
							<li>Content services as needed</li>
						</ul>
					</div>
					<div className="option bp3-card bp3-elevation-1" id="content">
						<h2>Content Services</h2>
						<p className="subtitle">
							For communities of all kinds and sizes looking to maximize their
							publishing opportunities.
						</p>
						<h3 className="pricing">Transparent Pricing</h3>
						<a
							href="mailto:partnerships@pubpub.org?subject=Content%20Services%20Inquiry"
							target="_blank"
							rel="noopener noreferrer"
							className="bp3-button bp3-large bp3-intent-primary"
						>
							Get In Touch
						</a>
						<p>
							We offer transparent pricing and a range of services—from site design
							and strategy, to content production and enhancements, to team trainings
							and community building.
						</p>
						<ul className="features">
							<li>Production work is completed at an hourly rate of $100/hour.</li>
							<li>
								Production of media and content interactives averages $350 per
								asset.
							</li>
							<li>
								Community design and structure is quoted on a project-by-project
								basis based on scope, timeline, and needs.
							</li>
						</ul>
						<p>
							Clients include{' '}
							<a
								href="https://academicentrepreneurship.pubpub.org/"
								target="_blank"
								rel="noopener noreferrer"
							>
								The Children's Hospital of Philadelphia
							</a>
							,{' '}
							<a
								href="https://hdsr.mitpress.mit.edu"
								target="_blank"
								rel="noopener noreferrer"
							>
								the Harvard Data Science Review
							</a>
							,{' '}
							<a
								href="https://participa.conl.mx/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Consejo Nuevo León
							</a>
							,{' '}
							<a href="https://apaopen.org" target="_blank" rel="noopener noreferrer">
								the American Psychological Association
							</a>
							,{' '}
							<a
								href="https://mit-serc.pubpub.org"
								target="_blank"
								rel="noopener noreferrer"
							>
								MIT's Schwarzman College of Computing
							</a>
							, and more.
						</p>
						<a
							href="https://help.pubpub.org/pub/content-services-menu"
							target="_blank"
							rel="noopener noreferrer"
							className="bp3-button bp3-large bp3-intent-secondary"
						>
							Learn more
						</a>
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
