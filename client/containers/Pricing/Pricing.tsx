import React from 'react';
import { Classes } from '@blueprintjs/core';

import { GridWrapper } from 'components';

require('./pricing.scss');

const Pricing = () => {
	return (
		<div id="pricing-container">
			<GridWrapper>
				<h1>PubPub is free.</h1>
				<p className="description top">
					PubPub's goal is to make knowledge creation accessible to everyone. To fulfill
					this mission, we offer access to PubPub and all features for free.
					<sup>*</sup> We do not sell data or rely on ancillary business streams. To
					ensure our work is community-driven and sustainable for the long term, we offer
					two ways for users to support PubPub.
				</p>
				<div className="pricing-tiers">
					<div className={`option ${Classes.CARD} ${Classes.ELEVATION_1}`}>
						<h2>KFG Membership</h2>
						<p>
							PubPub is built by the{' '}
							<a href="https://knowledgefutures.org">Knowledge Futures Group</a>, a
							non-profit dedicated to building public knowledge infrastructure. We ask
							that users who value PubPub consider becoming KFG Members to help ensure
							its longterm sustainability.
						</p>
						<p>
							Membership includes benefits like regular member programming, custom
							domains, email support, strategy consultation, and discounts on
							community services. We are dedicated to making membership accessible,
							and have multiple tiers with pricing based on ability to pay.
						</p>
						<a
							href="https://knowledgefutures.org/membership"
							className={`${Classes.BUTTON} ${Classes.LARGE} ${Classes.INTENT_PRIMARY}`}
						>
							Join us
						</a>
					</div>
					<div className={`option ${Classes.CARD} ${Classes.ELEVATION_1}`}>
						<h2>Community Services</h2>
						<p>
							For groups that want personalized support we offer production, training,
							and strategy services for building high quality, effective publishing
							communities. Services include content production, editorial services,
							site design, back file import, training, interactive production,
							branding, and more.
						</p>
						<p>
							Our clients include{' '}
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
							, and others.
						</p>
						<a
							href="/community-services"
							target="_blank"
							rel="noopener noreferrer"
							className={`${Classes.BUTTON} ${Classes.LARGE} ${Classes.INTENT_PRIMARY}`}
						>
							Learn more
						</a>
					</div>
				</div>
				<p className="fine-print">
					<sup>*</sup> For communities requiring DOIs, we have a limit of 10 free DOI
					registrations per community per year if published via PubPub's Crossref
					membership. Once the limit is reached, we ask that you become a{' '}
					<a href="https://knowledgefutures.org/membership">KFG member</a>, at any level,
					and allow us to pass on the Crossref fee of $1 per DOI registered. For groups
					with their own Crossref membership, there is no additional fee for creating or
					depositing DOIs.
				</p>
			</GridWrapper>
		</div>
	);
};

export default Pricing;
