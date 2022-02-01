import React from 'react';
import { Icon } from 'components';

require('./landing.scss');

const features = [
	{
		icon: 'badge',
		title: 'DOI Support',
		desc: 'Generate CrossRef DOIs for your documents in one click.',
	},
	{
		icon: 'shield',
		title: 'Submissions & Review',
		desc: 'Manage submissions and peer review directly on PubPub.',
	},
	{
		icon: 'comment',
		title: 'Discussions & Annotations',
		desc: 'Host public and private discussions with your readers and community, whether in your classroom or across the world.',
	},
	{
		icon: 'page-layout',
		title: 'Easily Customizable Layouts',
		desc: 'Create your custom site without writing a line of code.',
	},
	{
		icon: 'book',
		title: 'Collection Metadata',
		desc: 'Include article & collection-level metadata for easier organization of content and improved discovery.',
	},
	{
		icon: 'people',
		title: 'Access Control',
		desc: 'Allow anyone to access your content, or just the people you choose.',
	},
	{
		icon: 'grouped-bar-chart',
		title: 'Impact Measurement',
		desc: 'Learn about the people visiting your community with a full suite of privacy-respecting analytics.',
	},
	{
		icon: 'graph',
		title: 'Content Connections',
		desc: 'Add typed relationships — reviews, commentary, supplement, etc. — to your content and deposit them to Crossref.',
	},
	{
		icon: 'export',
		title: 'Document Export',
		desc: 'Export your work to PDF, Word, Markdown, LaTeX, JATS XML, and more.',
	},
] as const;

const communities = [
	{
		name: 'Harvard Data Science Review',
		description: 'A microscopic, telescopic & kaleidoscopic view of data science.',
		logo: '/static/landing/hdsr.png',
		type: 'Journals',
		category: 'Science',
		link: 'https://hdsr.mitpress.mit.edu',
	},
	{
		name: 'Frankenbook',
		description:
			'A collaborative, multimedia reading experiment with Mary Shelley’s classic novel.',
		logo: '/static/landing/frankenbook.png',
		type: 'Books',
		category: 'Literature',
		link: 'https://frankenbook.org',
	},
	{
		name: 'Collective Wisdom',
		description: "The British Library's early access and community review site.",
		logo: '/static/landing/collective.png',
		type: 'Resources',
		category: 'Reports',
		link: 'https://britishlibrary.pubpub.org/',
	},
	{
		name: 'SERC Ethical Computing',
		description: 'A series on the social and ethical responsibilities of computing.',
		logo: '/static/landing/serc.png',
		type: 'Resources',
		category: 'Case studies',
		link: 'https://mit-serc.pubpub.org',
	},
	{
		name: 'Contours Collaborations',
		description: 'A series on the social and ethical responsibilities of computing.',
		logo: '/static/landing/contours.png',
		type: 'Exhibits',
		category: 'Arts',
		link: 'https://contours.pubpub.org',
	},
	{
		name: 'Fermentology',
		description: 'On the culture, history, and novelty of fermented things.',
		logo: '/static/landing/fermentology.png',
		type: 'Learning Series',
		category: 'Multimedia',
		link: 'https://fermentology.pubpub.org/',
	},
	{
		name: 'Grad Journal of Food Studies',
		description:
			'An international student-run and refereed platform dedicated to encouraging and promoting interdisciplinary food scholarship at the graduate level',
		logo: '/static/landing/gafs.png',
		type: 'Student Journals',
		category: 'Interdisciplinary',
		link: 'https://gradfoodstudies.pubpub.org/',
	},
	{
		name: 'Critical Distance',
		description: 'A pandemic and games essay jam.',
		logo: '/static/landing/pgej.png',
		type: 'Conferences',
		category: 'Sprint',
		link: 'https://pandemics-and-games-essay-jam.pubpub.org/',
	},
	{
		name: 'MIT Press Open Architecture',
		description: 'An open collection of out-of-print humanities books.',
		logo: '/static/landing/arch.png',
		type: 'Collections',
		category: 'Open humanities',
		link: 'https://mitp-arch.mitpress.mit.edu/',
	},
];

const Landing = () => {
	const featureGrid = features.map((feature) => {
		return (
			<div className="feature" key={feature.icon}>
				<Icon icon={feature.icon} className="icon" />
				<div className="description">
					<h4>{feature.title}</h4>
					<p>{feature.desc}</p>
				</div>
			</div>
		);
	});

	const communityGrid = communities.map((community) => {
		return (
			// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element[]; className: string; ke... Remove this comment to see the full error message
			<div className="community" ker={community.name}>
				<div className="type">
					<strong>{community.type}</strong> / {community.category}
				</div>
				<h4 className="name">
					<a href={community.link}>{community.name}</a>
				</h4>
				<a href={community.link}>
					<img className="logo" src={community.logo} alt={`Logo of ${community.name}`} />
				</a>
				<p className="description">{community.description}</p>
			</div>
		);
	});
	return (
		<div id="landing-container">
			<style>{`
				.header-component.bp3-dark a.bp3-button,
				.header-component.bp3-dark a.bp3-button:hover {
					color: #111;
				}
			`}</style>
			{/* BEGIN Jumbotron */}
			<div id="jumbotron">
				{/* BEGIN Jumbotron Content */}
				<div className="container">
					<div className="row content">
						<div className="col-4">
							<h1>PubPub</h1>
							<p className="subtitle">
								The open-source, community-led, end-to-end publishing platform for
								knowledge communities.
							</p>
							<h2>Create knowledge. Share it with audiences who care.</h2>
							<div className="buttons">
								<a href="/community/create" className="custom-button black">
									Create your community
								</a>
							</div>
							<div className="buttons">
								<a href="/pricing" className="custom-button">
									Support PubPub
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/* END Jumbotron */}
			{/* BEGIN Main; content */}
			<div id="main">
				{/* BEGIN Mission Block */}
				<div id="mission">
					<div className="container restricted-width">
						<div>
							<h3>Mission</h3>
						</div>
						<div>
							As a product of the{' '}
							<a href="https://www.knowledgefutures.org">
								<strong>Knowledge Futures Group</strong>
							</a>
							, PubPub is open and accessible to all. That means a free, robust
							version of PubPub will always be available, operating under a
							non-profit, sustainable business model.
						</div>
						<div>
							<h3>Open & Community-Led</h3>
						</div>
						<div>
							<a className="git" href="https://github.com/pubpub/pubpub">
								<Icon icon="git-repo" /> code
							</a>
							<a className="git" href="https://github.com/orgs/pubpub/projects/9">
								<Icon icon="map" /> roadmap
							</a>
							<a className="git" href="https://github.com/pubpub/pubpub/discussions">
								<Icon icon="comment" /> forum
							</a>
						</div>
					</div>
				</div>
				{/* END Mission Block */}
				{/* BEGIN Features Block */}
				<div id="features">
					<div className="container key">
						<div>
							<h3>Key Features</h3>
						</div>
					</div>
					<div className="container reverse">
						<div>
							<h4>Collaborate & edit with co-authors in real time</h4>
							<img
								src="/static/landing/authoring.png"
								alt="Screenshot of a PubPub editor interface with multiple users editing at the same time."
							/>
						</div>
						<div>
							<p className="feature-number">01</p>
							<ul>
								<li key="01-01">Keep everyone in the loop</li>
								{/* <li key="01-02">Collaborate in real-time</li> */}
								<li key="01-03">Assign roles on-the-fly</li>
							</ul>
						</div>
						<div>
							<h4>Import your work from any source</h4>
							<img
								src="/static/landing/importing.png"
								alt="Screenshot of the PubPub import interface uploading a complex LaTeX document."
							/>
						</div>
						<div>
							<p className="feature-number">02</p>
							<ul>
								<li key="02-01">Easy multi-file imports</li>
								<li key="02-02">Complex-content friendly</li>
								<li key="02-03">Word, XML, LaTeX, and Markdown</li>
							</ul>
						</div>
						<div>
							<h4>Embed rich multimedia in your publication</h4>
							<img
								src="/static/landing/multimedia.png"
								alt="Examples of rich content embedded in Pubs, including an equation, a stem and tree chart, and an interactive song picker."
							/>
						</div>
						<div>
							<p className="feature-number">03</p>
							<ul>
								<li key="03-01">Data visualizations</li>
								<li key="03-02">Images, videos, and math</li>
								<li key="03-03">Code, interactives, and more</li>
							</ul>
						</div>
						<div className="other-features">
							<h3>Other Features</h3>
						</div>
						<div className="feature-grid">{featureGrid}</div>
					</div>
				</div>
				{/* END Features Block */}
				{/* BEGIN Case Study Block */}
				<div id="case-study">
					<div className="container">
						<div>
							<h3>Community Services</h3>
						</div>
						<div>
							<p>
								For groups that want personalized support we offer production,
								training, and strategy services for building high quality, effective
								publishing communities.
							</p>
							<blockquote>
								"The team’s innovation and experience made for an incredible
								collaboration."
								<br />
								<span className="attribution">
									- Jeremy Bailenson, Author, “
									<a href="https://doi.org/10.1037/tmb0000030">
										A Theoretical Argument for the Causes of Zoom Fatigue
									</a>
									”
								</span>
							</blockquote>
							<div className="buttons">
								<a href="/community-services" className="custom-button light">
									Learn more
								</a>
							</div>
						</div>
					</div>
				</div>
				{/* END Case Study Block */}
				{/* BEGIN Communities Block */}
				<div id="communities">
					<div className="container">
						<div>
							<h3>Use Cases</h3>
						</div>
						<div>
							<p>
								Thousands of communities are tailoring PubPub to suit their
								publishing needs, goals, and content types.
							</p>
							<div className="community-grid">{communityGrid}</div>
							<div className="buttons">
								<a href="/explore" className="custom-button">
									Explore Communities
								</a>
							</div>
						</div>
					</div>
				</div>
				{/* END Communities Block */}
				{/* BEGIN Create Block */}
				<div id="create">
					<div className="container restricted-width">
						<div>
							<h3>Create</h3>
						</div>
						<div>
							<h4>Anyone can start a PubPub Community, anytime, for free.</h4>
							<div className="buttons">
								<a href="/community/create" className="custom-button">
									Create your community
								</a>
							</div>
							<p className="disclaimer">
								* A community can be your individual space to create content, or you
								can invite others to collaborate with you!
							</p>
						</div>
					</div>
				</div>
				{/* END Create Block */}
				{/* BEGIN Pitch Block */}
				<div id="pitch">
					<div className="container restricted-width reverse">
						<div>
							<p>
								PubPub empowers knowledge communities to define their own community
								engagement models and manage their publishing workflows. Use PubPub
								to more closely align knowledge sharing with community building.
							</p>
						</div>
					</div>
				</div>
				{/* END Create Block */}
			</div>
			{/* END Main content */}
		</div>
	);
};

export default Landing;
