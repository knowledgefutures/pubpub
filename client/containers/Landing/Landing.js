import React from 'react';
import PropTypes from 'prop-types';
import CommunityPreview from 'components/CommunityPreview/CommunityPreview';
import LandingFeature from 'components/LandingFeature/LandingFeature';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { hydrateWrapper, getResizedUrl } from 'utilities';

require('./landing.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	landingData: PropTypes.object.isRequired,
};

const Landing = (props)=> {
	const landingData = props.landingData;
	const features = [
		{
			title: 'Collaborative Real-Time Editing',
			description: 'Edit documents in real-time with your team. Or, open your document to the public for large-scale collaboration.',
			icon: 'edit',
		},
		{
			title: 'Rich Media Documents',
			description: 'Embed videos, LaTeX equations, references, interactive frames, and more.',
			icon: 'media',
		},
		{
			title: 'Flexible, Structured Review',
			description: 'Implement double-blind review, no review, or anything in between.',
			icon: 'endorsed',
		},
		{
			title: 'Import And Export',
			description: 'Import and export from Microsoft Word, LaTex, ePub, PDF, XML, HTML, and more.',
			icon: 'import',
		},
		{
			title: 'Community Discussions and Annotations',
			description: 'Invite the public to comment, limit feedback to selected experts, or keep your community private and close-knit.',
			icon: 'chat',
		},
		{
			title: 'Modern, Customizable Layouts',
			description: 'Publish your work on a fast-loading, mobile-friendly, customizable website.',
			icon: 'page-layout',
		},
		{
			title: 'LaTex Equation Support',
			description: 'Write complex functions directly in the editor, in real-time.',
			icon: 'variable',
		},
		{
			title: 'Cite And Be Cited',
			description: 'Easily create DOIs for you work, add citations by DOI, and allow others to cite excerpts and discussions.',
			icon: 'citation',
		}
	];
	return (
		<div id="landing-container">
			<PageWrapper
				loginData={props.loginData}
				communityData={props.communityData}
				locationData={props.locationData}
				hideNav={true}
			>
				<div className="container narrow">
					<div className="row">
						<div className="col-12">
							<h2>High quality, transparent publishing</h2>
							<div className="subtitle">Research, draft, review, and publish with your community, all in one place.<br />PubPub launches in beta on October 15.</div>
							<div className="action">
									<a className="pt-button pt-intent-primary pt-large" target="_blank" href="http://eepurl.com/dyRqBr">Signup for updates</a>
							</div>
							<div className="image-wrapper pt-elevation-3">
								<img src={getResizedUrl('https://assets.pubpub.org/_site/landing-responsive-framed.png', null, '800x0')} alt="PubPub Community" />
								{/*
								<img src="https://jakejr.pubpub.org/fit-in/800x0/_site/landing-viral-framed.png" alt="PubPub Community" />
								<img src="https://jakejr.pubpub.org/fit-in/800x0/_site/landing-joi-framed.png" alt="PubPub Community" />
								<img src="https://jakejr.pubpub.org/fit-in/800x0/_site/landing-plix-framed.png" alt="PubPub Community" />
								*/}
							</div>
						</div>

						<div className="col-12">
							<h2>Explore Active Communities</h2>
							<div className="subtitle">Journals, book publishers, conferences, and research groups use PubPub to make their work more accessible, interactive, and transparent.</div>
						</div>

						{landingData.activeCommunities.map((item)=> {
							return (
								<div className="col-4" key={`active-${item.id}`}>
									<CommunityPreview
										subdomain={item.subdomain}
										domain={item.domain}
										title={item.title}
										description={item.description}
										largeHeaderBackground={item.largeHeaderBackground}
										largeHeaderLogo={item.largeHeaderLogo}
										accentColor={item.accentColor}
										accentTextColor={item.accentTextColor}
										numPubs={item.numPubs}
										numDiscussions={item.numDiscussions}
									/>
								</div>
							);
						})}
						<div className="col-12 explore-all-button">
							<a href="/explore" className="pt-button pt-intent-primary pt-large">Explore All Communities</a>
							<div className="create-new-message">
								Interested in creating your own community? Please contact <a href="mailto:team@pubpub.org">team@pubpub.org</a>.
							</div>
						</div>

						<div className="col-12">
							<h2>Rich features for community publishing</h2>
							<div className="subtitle">Take control of your research. PubPub allows you to publish complex documents with and for your community.</div>
						</div>
						<div className="row flex">
							{features.map((item)=> {
								return (
									<div className="col-6" key={`feature-${item.icon}`}>
										<LandingFeature
											title={item.title}
											icon={item.icon}
											description={item.description}
										/>
									</div>
								);
							})}
						</div>
						<div className="col-12">
							<h2>Free, open access, and open-source</h2>
							<div className="subtitle">Part of MIT’s <a href="https://mitpress.mit.edu/kfg" target="_blank">Knowledge Futures Group</a>, we are committed to providing PubPub for free forever, releasing <a href="https://github.com/pubpub" target="_blank">open-source code</a>, and operating under non-profit, researcher-friendly business models. We sustain PubPub with donations and by charging for advanced setup and features, not by charging for access to knowledge or running ads.</div>
						</div>
					</div>
				</div>
			</PageWrapper>
		</div>
	);
};

Landing.propTypes = propTypes;
export default Landing;

hydrateWrapper(Landing);
