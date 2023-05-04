import React from 'react';

require('./twoColumnFooter.scss');

type SmallPrint = {
	key: string;
	text: string;
};

type IconLink = {
	url: string;
	ariaLabel: string;
	pathProps?: {
		d: string;
		id?: string;
		fill?: string;
	} & Pick<React.SVGProps<SVGPathElement>, 'fillRule'>;
};

type Link = {
	url: string;
	text: string;
};

export type TwoColumnFooterProps = {
	certification?: {
		url: string;
		alt: string;
		imageUrl: string;
	};
	copyright: {
		date: string;
		attribution: string;
		url: string;
		type: string;
		exception: string;
	};
	addressLines: string[];
	fullWidthLink: {
		url: string;
		path: string;
		text: string;
	};
	showEmailCallToAction?: boolean;
	showInvestorLogos?: boolean;
	smallPrints: SmallPrint[];
	iconLinks: IconLink[];
	links: Link[];
};

const TwoColumnFooter = (props: TwoColumnFooterProps) => {
	const { copyright, addressLines, smallPrints, certification, iconLinks, links, fullWidthLink } =
		props;
	const emailCallToAction = props.showEmailCallToAction ? (
		<section className="email-cta">
			<div className="email-cta__container">
				<header className="email-cta__header">
					<h2 className="email-cta__header_text">
						Be the first to read new articles from eLife
					</h2>
				</header>
				<a href="/content-alerts" className="button button--default email-cta__button">
					Sign up for email alerts
				</a>
				<div className="email-cta__privacy">
					<a className="email-cta__privacy_link" href="/privacy">
						Privacy notice
					</a>
				</div>
			</div>
		</section>
	) : null;
	const investorLogos = props.showInvestorLogos ? (
		<ol className="investor-logos" aria-label="eLife is funded by these organisations">
			<li className="investor-logos__item">
				<div className="investor-logos__container">
					<picture className="investor-logos__picture">
						<img
							src="https://elifesciences.org/assets/images/investors/hhmi.9d0951a2.svg"
							alt="Howard Hughes Medical Institute"
							className="investor-logos__img"
						/>
					</picture>
				</div>
			</li>
			<li className="investor-logos__item">
				<div className="investor-logos__container">
					<picture className="investor-logos__picture">
						<img
							src="https://elifesciences.org/assets/images/investors/wellcome.813f8634.svg"
							alt="Wellcome Trust"
							className="investor-logos__img"
						/>
					</picture>
				</div>
			</li>
			<li className="investor-logos__item">
				<div className="investor-logos__container">
					<picture className="investor-logos__picture">
						<img
							src="https://elifesciences.org/assets/images/investors/max.89cebd37.svg"
							alt="Max-Planck-Gesellschaft"
							className="investor-logos__img"
						/>
					</picture>
				</div>
			</li>
			<li className="investor-logos__item">
				<div className="investor-logos__container">
					<picture className="investor-logos__picture">
						<img
							src="https://elifesciences.org/assets/images/investors/kaw.c1bb2e4b.svg"
							alt="Knut and Alice Wallenberg Foundation"
							className="investor-logos__img"
						/>
					</picture>
				</div>
			</li>
		</ol>
	) : null;

	return (
		<div className="two-column-footer-component">
			{emailCallToAction}
			{investorLogos}
			<div className="columns">
				<div className="column left">
					<nav className="footer-navigation">
						<ul className="footer-navigation__list">
							{links.map((link) => (
								<li key={link.text} className="footer-navigation__list_item">
									<a href={link.url} className="footer-navigation__list_link">
										{link.text}
									</a>
								</li>
							))}
						</ul>
					</nav>
					<div className="social-links" aria-label="Social media links">
						<ul className="social-links__list">
							{iconLinks.map((link) => (
								<li key={link.ariaLabel} className="social-links__list_item">
									<a
										href={link.url}
										className="social-links__list_link"
										aria-label={link.ariaLabel}
									>
										<svg width="28" height="28">
											<path {...link.pathProps} />
										</svg>
									</a>
								</li>
							))}
						</ul>
					</div>
					<div className="github-link-wrapper">
						<a href={fullWidthLink.url} className="github-link">
							<svg width="20" height="20">
								<g
									id="Page-1"
									stroke="none"
									strokeWidth="1"
									fill="none"
									fillRule="evenodd"
								>
									<g id="github-logo-svg" fill="#000000">
										<path d={fullWidthLink.path} />
									</g>
								</g>
							</svg>
							<div className="github-link--text">{fullWidthLink.text}</div>
						</a>
					</div>
					{certification && (
						<div className="certification-wrapper">
							<a href={certification.url} className="certification-link">
								<img src={certification.imageUrl} alt={certification.alt} />
							</a>
						</div>
					)}
				</div>

				<div className="column right">
					<div className="site-smallprint">
						{smallPrints.map((smallPrint) => (
							<p>
								<small key={smallPrint.key}>{smallPrint.text}</small>
							</p>
						))}
						<p>
							<address>
								{addressLines.map((line, index) => (
									<>
										{line}
										{index < addressLines.length - 1 && <br />}
									</>
								))}
							</address>
						</p>
					</div>
					<div className="site-smallprint">
						<small>
							© <time>{copyright.date}</time> {copyright.attribution} Subject to a{' '}
							<a
								href={copyright.url}
								rel="license"
								className="site-smallprint__copyright_link"
							>
								{copyright.type}
							</a>
							{copyright.exception}
						</small>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TwoColumnFooter;
