import React from 'react';
import PropTypes from 'prop-types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Icon from 'components/Icon/Icon';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { hydrateWrapper } from 'utilities';

require('./landing.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
};

class Landing extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			landingHeader: 'Communities',
		};
	}

	componentDidMount() {
		const landingHeaders = ['Journals', 'Publishers', 'Conferences', 'Researchers', 'Communities'];
		setInterval(() => {
			const currentIndex = landingHeaders.indexOf(this.state.landingHeader);
			const nextIndex = (currentIndex + 1) % landingHeaders.length;
			this.setState({
				landingHeader: landingHeaders[nextIndex],
			});
		}, 4000);
	}

	render() {
		const features = [
			{
				icon: 'edit',
				title: 'Collaborative Editor',
				desc: 'Draft with colleagues around the world in real-time.',
			},
			{
				icon: 'media',
				title: 'Rich Media Embeds',
				desc: 'Add videos, photos, tables, and interactives to your publications.',
			},
			{
				icon: 'changes',
				title: 'Import & Export',
				desc: 'Support for MS Word, LaTex, XML, ePub, and more.',
			},
			{
				icon: 'citation',
				title: 'Citation Management',
				desc: 'Easily add and manage citations, footnotes, and figure notes.',
			},
			{
				icon: 'function',
				title: 'Equation Editor',
				desc: 'Embed and edit LaTex equations right in your documents.',
			},
			{
				icon: 'badge',
				title: 'DOI Support',
				desc: 'Generate CrossRef DOIs for your documents in one click, for free.',
			},
			{
				icon: 'book',
				title: 'Chapters & Sections',
				desc: 'Break long documents into browsable chapters and sections.',
			},
			{
				icon: 'comment',
				title: 'Discussions & Annotations',
				desc: 'Host public and private discussions with your readers and community.',
			},
			{
				icon: 'shield',
				title: 'Submissions & Review',
				desc: 'Manage submissions and peer review right from within PubPub.',
			},
			{
				icon: 'page-layout',
				title: 'Beautiful Layouts',
				desc: 'Host your entire site on PubPub with customizable, mobile-friendly page layouts.',
			},
			{
				icon: 'people',
				title: 'Access Levels',
				desc: 'Allow anyone to access your community, or just the people you choose.',
			},
			{
				icon: 'lightbulb',
				title: 'More To Come',
				desc: 'We\'re constantly adding new features, and love hearing ideas from users like you.',
			}
		];
		return (
			<div id="landing-container">
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
					hideNav={true}
				>
					{/* BEGIN Jumbotron */}
					<div id="jumbotron">
						{/* BEGIN Jumbotron Content */}
						<div className="container">
							<div className="row content">
								<div className="col-12">
									<h1>
										<TransitionGroup className="landing-header" component="span">
											<CSSTransition
												timeout={750}
												classNames="landing-header"
												appear={true}
												key={this.state.landingHeader}
											>
												<span className="landing-header">{this.state.landingHeader}</span>
											</CSSTransition>
										</TransitionGroup>
										&nbsp;use PubPub to make their research stronger.
									</h1>
									<p className="subtitle">Collaboratively draft, review, and publish in an integrated, iterative process.</p>
									<div className="buttons">
										<a href="/signup" className="pt-button pt-intent-primary pt-large">Join PubPub</a>
										<a href="/community/create" className="pt-button pt-large">Create your Community</a>
									</div>
									<img src="/static/landing/hero.png" alt="" className="hero" />
								</div>
							</div>
						</div>
						{/* END Jumbotron Content */}
					</div>
					{/* END Jumbotron */}
					{/* BEGIN Main content */ }
					<div id="main">
						{/* BEGIN Community Block */}
						<div className="bg" id="communities">
							<div className="container">
								<div className="row">
									<div className="col-12">
										<p className="divider">
											<Icon icon="people" iconSize={30} />
										</p>
										<h2>Start Your Community</h2>
										{/* Books */}
										<div className="type-block">
											<div className="content">
												<div className="title">For Journals</div>
												<p className="description">Host and publish your entire journal on PubPub. Accept submissions, manage peer review, publish to the web with one-click DOI generation, export to print, and more.</p>
												<div className="buttons">
													<a href="/community/create" className="pt-button pt-intent-primary pt-large">Create your Journal</a>
												</div>
											</div>
											<div className="image">
												<img alt="Journal communities" src="/static/landing/journals.png" />
												<p className="credit"><a href="https://jods.mitpress.mit.edu" target="_blank" rel="noopener noreferrer">Journal of Design and Science</a> / <a alt="Stanford Blockchain community" href="http://stanford-jblp.pubpub.org" target="_blank" rel="noopener noreferrer">Stanford Journal of Blockchain Law & Policy</a></p>
											</div>
										</div>

										{/* Books */}
										<div className="type-block flipped">
											<div className="content">
												<div className="title">For Book Publishers</div>
												<p className="description">Publish beautiful digital editions of your books on PubPub. Embed bonus multimedia content, include interactive discussions and annotations, and use analytics to make smarter publishing decisions.</p>
												<div className="buttons">
													<a href="/community/create" className="pt-button pt-intent-primary pt-large">Create your Book</a>
												</div>
											</div>
											<div className="image">
												<a href="https://www.frankenbook.org" target="_blank" rel="noopener noreferrer"><img alt="Frankenbook" className="pt-elevation-2" src="/static/landing/frankenbook.png" /></a>
												<p className="credit"><a href="https://frankenbook.org" target="_blank" rel="noopener noreferrer">Frankenbook</a></p>
											</div>
										</div>

										{/* Research Labs */}
										<div className="type-block">
											<div className="content">
												<div className="title">For Research Labs</div>
												<p className="description">Host your lab’s online presence on PubPub. Publicly post papers and citations, publish a lab blog, host resources, and use private channels for lab notes and journal clubs.</p>
												<div className="buttons">
													<a href="/community/create" className="pt-button pt-intent-primary pt-large">Create your Lab Site</a>
												</div>
											</div>
											<div className="image">
												<img alt="Lab communities" src="/static/landing/labs.png" />
												<p className="credit"><a href="https://www.responsivescience.org" target="_blank" rel="noopener noreferrer">Responsive Science</a> / <a href="http://viral.pubpub.org" target="_blank" rel="noopener noreferrer">Viral Communications</a></p>
											</div>
										</div>

										{/* Conferences */}
										<div className="type-block flipped">
											<div className="content">
												<div className="title">For Conferences</div>
												<p className="description">Host your interactive conference website on PubPub. Solicit and review submissions, publish accepted papers, post blogs and recaps, and encourage private and public conversation before and after your gathering.</p>
												<div className="buttons">
													<a href="/community/create" className="pt-button pt-intent-primary pt-large">Create your Conference</a>
												</div>
											</div>
											<div className="image">
												<a href="https://millie.pubpub.org" target="_blank" rel="noopener noreferrer"><img alt="Millie Conference" className="pt-elevation-2" src="/static/landing/millie.png" /></a>
												<p className="credit"><a href="https://millie.pubpub.org" target="_blank" rel="noopener noreferrer">Celebrating Millie</a></p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						{/* END Community Block */}
						{/* BEGIN O/S Block */}
						<div className="bg" id="opensource">
							<div className="container">
								<div className="row">
									<div className="col-12">
										<div className="header">
											<h2>
												<Icon icon="tick" iconSize={28} /> Free
											</h2>
											<h2>
												<Icon icon="tick" iconSize={28} /> Open Access
											</h2>
											<h2>
												<Icon icon="tick" iconSize={28} /> Open Source
											</h2>
											<h2>
												<Icon icon="tick" iconSize={28} /> Sustainable
											</h2>
										</div>
										<div className="content">
											<p>A member of MIT’s <a href="https://mitpress.mit.edu/kfg" target="_blank" rel="noopener noreferrer">Knowledge Futures Group</a>, we are committed to providing PubPub for free forever, releasing open-source code, and operating under non-profit, sustainable, researcher-friendly business models.</p>
											<div className="pubpub-links">
												<a href="/about" className="pt-button pt-large">Our Mission</a>
												<a href="https://github.com/pubpub/pubpub"><Icon icon="git-repo" /> pubpub</a>
												<a href="https://github.com/pubpub/pubpub-editor"><Icon icon="git-repo" /> pubpub-editor</a>
												{/* <a>review-maps</a> */}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						{/* END O/S Block */}
						{/* BEGIN Features Block */}
						<div className="bg" id="features">
							<div className="container">
								<div className="row">
									<div className="col-12">
										<h2>Rich Features for Community Publishing</h2>
										<p className="subtitle">Everything you need to write, review, publish, and discuss, all in one place.</p>
										<ul className="feature-list">
											{features.map((feature)=> {
												return (
													<li key={feature.title}>
														<div className="icon"><Icon icon={feature.icon} iconSize={24} /></div>
														<div className="feature-description">
															<p className="title">{feature.title}</p>
															<p className="description">{feature.desc}</p>
														</div>
													</li>
												);
											})}
										</ul>
										<div className="image" />
									</div>
								</div>
							</div>
						</div>
						{/* END Features Block */}
						{/* BEGIN For Your */}
						<div className="bg" id="foryou">
							<div className="container">
								<div className="row">
									<div className="col-12">
										<h2>Built For You</h2>
										<p className="description">We designed PubPub with flexibility in mind. Use every feature, or just the ones you need. If you’re an individual, company, or community that needs to collaboratively draft, review, edit and publish documents, we want to support you.</p>
										<div className="buttons">
											<a href="mailto:team@pubpub.org" className="pt-button pt-intent-primary pt-large">Get in touch</a>
											<a href="/explore" className="pt-button pt-large">Explore the possibilities</a>
										</div>
									</div>
								</div>
							</div>
						</div>
						{/* END For You */}
					</div>
					{/* END Main content */}
				</PageWrapper>
			</div>
		);
	}
}

Landing.propTypes = propTypes;
export default Landing;

hydrateWrapper(Landing);
