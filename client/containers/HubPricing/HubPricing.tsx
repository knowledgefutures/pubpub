import React from 'react';

import { GridWrapper } from 'components';

import './hubPricing.scss';

const HubPricing = () => {
	return (
		<div className="hub-pricing-component">
			{/* Hero */}
			<div className="hp-hero">
				<div className="hp-hero-inner">
					<p className="hp-hero-eyebrow">PubPub Hubs</p>
					<h1 className="hp-hero-title">Pricing</h1>
					<p className="hp-hero-subtitle">
						Publishing on PubPub is free. Anyone, anywhere, can create a Community and
						publish their work at no cost. Hubs help organize and present those
						communities.
					</p>
				</div>
			</div>

			<GridWrapper>
				<div className="hp-body">
					{/* What is a Hub */}
					<section className="hp-section">
						<p className="hp-lede">
							A Hub is tooling for groups that want to curate, coordinate, and report
							on publishing activity across multiple Communities under their umbrella.
							It provides a dashboard and organizing layer for universities,
							foundations, and other organizations operating at scale.
						</p>
						<p className="hp-lede">
							Hub pricing supports PubPub's ability to maintain the free publishing
							layer for everyone, and to keep building open scholarly infrastructure
							that isn't captured by proprietary interests. Every paying Hub helps
							sustain that mission.
						</p>
					</section>

					{/* Annual pricing */}
					<section className="hp-section">
						<h2 className="hp-section-title">Annual pricing</h2>
						<div className="hp-table-wrapper">
							<table className="hp-pricing-table">
								<thead>
									<tr>
										<th>Sector</th>
										<th>Subtype</th>
										<th className="hp-col-price">Annual</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td rowSpan={3} className="hp-sector-cell">
											Academic institutions
										</td>
										<td>
											Small / mid institutions
											<span className="hp-tier-note">
												Carnegie T1–3 — Associates, Tribal, Special Focus,
												Baccalaureate, Master's, Liberal Arts
											</span>
										</td>
										<td className="hp-col-price">$5,000</td>
									</tr>
									<tr>
										<td>
											Doctoral &amp; larger Master's
											<span className="hp-tier-note">Carnegie T4</span>
										</td>
										<td className="hp-col-price">$10,000</td>
									</tr>
									<tr>
										<td>
											R1/R2 research universities, ARL members
											<span className="hp-tier-note">Carnegie T5</span>
										</td>
										<td className="hp-col-price">$15,000</td>
									</tr>
									<tr>
										<td rowSpan={2} className="hp-sector-cell">
											Grantmaking foundations
										</td>
										<td>Assets under $500M</td>
										<td className="hp-col-price">$25,000</td>
									</tr>
									<tr>
										<td>Assets $500M+</td>
										<td className="hp-col-price">$50,000</td>
									</tr>
									<tr>
										<td className="hp-sector-cell">Nonprofit organizations</td>
										<td>
											Non-academic - museums, think tanks, mission-driven orgs
										</td>
										<td className="hp-col-price">$10,000</td>
									</tr>
									<tr>
										<td className="hp-sector-cell">For-profit companies</td>
										<td></td>
										<td className="hp-col-price">$30,000</td>
									</tr>
									<tr>
										<td className="hp-sector-cell">
											Minority-Serving Institutions
										</td>
										<td>
											TCUs, HBCUs, HSIs, and other federally designated MSIs
										</td>
										<td className="hp-col-price">$2,500</td>
									</tr>
									<tr>
										<td className="hp-sector-cell">Global access</td>
										<td>Research4Life Group A institutions</td>
										<td className="hp-col-price">$2,500</td>
									</tr>
								</tbody>
							</table>
						</div>
						<p className="hp-table-note">
							If none of these fit,{' '}
							<a href="mailto:partnerships@pubpub.org">talk to us</a> - we'll figure
							something out together.
						</p>
					</section>

					{/* International */}
					<section className="hp-section">
						<h2 className="hp-section-title">International institutions</h2>
						<p>
							Carnegie only classifies U.S. institutions. We map institutions
							elsewhere to comparable tiers based on research activity and
							institutional scale:
						</p>
						<div className="hp-intl-list">
							<div className="hp-intl-item">
								<h3>Canada</h3>
								<p>
									ARL members → T5. U15 institutions → T4–5. Other
									doctoral-granting → T4. Master's-granting → T3.
									Undergraduate-only → T1–3. Community colleges → T1–3.
								</p>
							</div>
							<div className="hp-intl-item">
								<h3>United Kingdom &amp; Ireland</h3>
								<p>
									Russell Group → T5. Other research-intensive → T4. Post-92 and
									teaching-focused → T1–3. Specialist institutions → T1–3.
								</p>
							</div>
							<div className="hp-intl-item">
								<h3>Continental Europe</h3>
								<p>
									Research-intensive (LERU, Coimbra) → T4–5. Teaching-focused and
									applied-sciences → T1–3.
								</p>
							</div>
							<div className="hp-intl-item">
								<h3>Australia &amp; New Zealand</h3>
								<p>
									Group of Eight → T5. Other research-intensive → T4.
									Teaching-focused → T1–3.
								</p>
							</div>
							<div className="hp-intl-item">
								<h3>East &amp; Southeast Asia</h3>
								<p>
									Research-intensive (C9 League, RU11, SKY, NUS, HKU) → T5. Other
									doctoral-granting → T4. Teaching-focused → T1–3.
								</p>
							</div>
							<div className="hp-intl-item">
								<h3>South Asia</h3>
								<p>
									IITs, IISc, and equivalent → T4–5. Other doctoral-granting → T4.
									Teaching-focused → T1–3. Research4Life Group A countries use the
									Global access rate.
								</p>
							</div>
							<div className="hp-intl-item">
								<h3>Latin America &amp; the Caribbean</h3>
								<p>
									Major research universities (UNAM, USP, UBA, PUC-Rio,
									Universidad de Chile) → T4–5. Other doctoral-granting → T4.
									Teaching-focused → T1–3. Research4Life Group A countries use the
									Global access rate.
								</p>
							</div>
							<div className="hp-intl-item">
								<h3>Africa</h3>
								<p>
									Research-intensive outside Research4Life coverage (UCT,
									Stellenbosch, Wits, Pretoria) → T4–5. Research4Life Group A
									countries use the Global access rate.
								</p>
							</div>
							<div className="hp-intl-item">
								<h3>Middle East &amp; North Africa</h3>
								<p>
									Research-intensive (KAUST, Tel Aviv University, Hebrew
									University, AUB, AUC) → T4–5. Other doctoral-granting → T4.
									Teaching-focused → T1–3. Research4Life Group A countries use the
									Global access rate.
								</p>
							</div>
						</div>
						<p className="hp-intl-footnote">
							Institutions in Research4Life Group A countries are covered by the
							Global access rate regardless of size. Institutions in Research4Life
							Group B countries should{' '}
							<a href="mailto:partnerships@pubpub.org">contact us</a> to discuss
							placement, we'll work out a fair rate. If your institution's placement
							isn't obvious from this list,{' '}
							<a href="mailto:partnerships@pubpub.org">get in touch</a>.
						</p>
					</section>

					{/* How to find your tier */}
					<section className="hp-section">
						<h2 className="hp-section-title">How to find your tier</h2>
						<p>
							U.S. academic institutions can look up their classification at{' '}
							<a
								href="https://carnegieclassifications.acenet.edu"
								target="_blank"
								rel="noopener noreferrer"
							>
								carnegieclassifications.acenet.edu
							</a>
							. If you're not sure where you fit, or if the framework doesn't quite
							describe your organization,{' '}
							<a href="mailto:partnerships@pubpub.org">get in touch</a> and we'll help
							place you.
						</p>
					</section>

					{/* What's included */}
					<section className="hp-section">
						<h2 className="hp-section-title">What's included</h2>
						<p>Every Hub includes:</p>
						<div className="hp-features-grid">
							<div className="hp-feature-card">
								<h3>Branded home</h3>
								<p>A dedicated home for your organization's publishing activity</p>
							</div>
							<div className="hp-feature-card">
								<h3>Curation</h3>
								<p>Organization and curation across all your Communities</p>
							</div>
							<div className="hp-feature-card">
								<h3>Analytics</h3>
								<p>Usage analytics and reporting across publications</p>
							</div>
							<div className="hp-feature-card">
								<h3>Custom branding</h3>
								<p>Dedicated URL and institutional branding</p>
							</div>
						</div>
					</section>

					{/* FAQ */}
					<section className="hp-section">
						<h2 className="hp-section-title">Common questions</h2>
						<div className="hp-faq-list">
							<details className="hp-faq-item" open>
								<summary>
									What's the difference between a Community and a Hub?
								</summary>
								<p>
									A Community is where publishing happens — a journal, a book, a
									working paper series, a preprint archive. Communities are free
									to create and use. A Hub sits above your Communities and gives
									your organization a single place to curate, report on, and
									organize the publishing happening under your name.
								</p>
							</details>
							<details className="hp-faq-item">
								<summary>Do we need a Hub?</summary>
								<p>
									Most publishers don't. A single journal, a book series, a small
									research group — all of that works beautifully with Communities
									alone, at no cost. Hubs are for organizations operating
									publishing activity at a scale where coordination and reporting
									become valuable: a university with multiple presses and
									journals, a foundation tracking its grantees' publications, a
									museum with several publishing initiatives.
								</p>
							</details>
							<details className="hp-faq-item">
								<summary>
									Is there a limit on how many Communities sit under our Hub?
								</summary>
								<p>
									No. Curate as many Communities as your organization needs under
									your single Hub subscription.
								</p>
							</details>
							<details className="hp-faq-item">
								<summary>
									What about Canadian institutions, or institutions outside the
									regions listed?
								</summary>
								<p>
									We'll work with you to identify a comparable tier. The mapping
									isn't mechanical; tell us about your institution and we'll place
									you fairly.
								</p>
							</details>
							<details className="hp-faq-item">
								<summary>
									How do the Minority-Serving Institution and Global access rates
									work?
								</summary>
								<p>
									Self-select when you sign up. We spot-check against the relevant
									federal designations (for MSIs) and the Research4Life
									classification lists (for Global access). There's no application
									process — we trust institutions to identify themselves
									accurately.
								</p>
							</details>
							<details className="hp-faq-item">
								<summary>
									Can Hub pricing be adjusted for our specific situation?
								</summary>
								<p>
									Yes. The table above covers most cases, but we know it won't
									cover everything. Museums with budgets larger than some
									universities, independent scholarly presses, community-based
									research organizations — if the standard tiers don't fit,{' '}
									<a href="mailto:partnerships@pubpub.org">email us</a>. We'd
									rather have a conversation than lose a good-fit partner to a
									bad-fit price.
								</p>
							</details>
							<details className="hp-faq-item">
								<summary>What does the annual fee support?</summary>
								<p>
									Ongoing platform development, infrastructure, the small team
									maintaining it all, and the free publishing layer available to
									every Community. As a nonprofit, any surplus goes back into the
									platform and the open scholarly infrastructure community. Our
									audited financials are published annually.
								</p>
							</details>
						</div>
					</section>

					{/* CTA */}
					<section className="hp-section hp-cta-section">
						<h2 className="hp-cta-title">Start your Hub</h2>
						<p className="hp-cta-description">
							Tell us about your organization and what you're trying to coordinate.
							We'll help you figure out the right tier and get your Hub running.
						</p>
						<a href="mailto:partnerships@pubpub.org" className="hp-cta-button">
							Get in touch →
						</a>
					</section>
				</div>
			</GridWrapper>
		</div>
	);
};

export default HubPricing;
