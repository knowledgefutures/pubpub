import React from 'react';
import { Icon } from 'components';

require('./landing.scss');

const Landing = () => {
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
			desc:
				'Host public and private discussions with your readers and community, whether in your classroom or across the world.',
		},
		{
			icon: 'page-layout',
			title: 'Beautiful, Customizable Layouts',
			desc: 'Create your custom site without writing a line of code.',
		},
		{
			icon: 'book',
			title: 'Collection Metadata',
			desc:
				'Include article & collection-level metadata for easier organization of content and improved discovery.',
		},
		{
			icon: 'changes',
			title: 'Branches as versions',
			desc:
				'Work on multiple versions by creating different branches and merging when ready.',
		},
		{
			icon: 'people',
			title: 'Access Control',
			desc: 'Allow anyone to access your content, or just the people you choose.',
		},
		{
			icon: 'lightbulb',
			title: 'Suggest a feature',
			desc:
				"We're constantly adding new features, and love hearing ideas from users like you.",
		},
	];
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
	const communities = [
		{
			name: 'Harvard Data Science Review',
			description: 'A Microscopic, Telescopic & Kaleidoscopic View of Data Science',
			logo: '/static/landing/hdsr.png',
			type: 'Journal',
			category: 'Science',
			link: 'https://hdsr.mitpress.mit.edu',
		},
		{
			name: 'Stanford JBLP',
			description:
				'The first law journal to publish on the greater blockchain technology space',
			logo: '/static/landing/sjblp.png',
			type: 'Journal',
			category: 'Law',
			link: 'https://stanford-jblp.pubpub.org/',
		},
		{
			name: 'Cursor_',
			description: 'Journal for Explorative Theology',
			logo: '/static/landing/cursor.png',
			type: 'Journal',
			category: 'Theology',
			link: 'https://cursor.pubpub.org/',
		},
		{
			name: 'punctum Comms',
			description: 'Communications / Commons / Community',
			logo: '/static/landing/punctum.png',
			type: 'Blog',
			category: 'Publishing',
			link: 'https://punctumbooks.pubpub.org/',
		},
		{
			name: 'Expansive Digital Publishing',
			description:
				"Duke University Libraries' framework for how libraries can begin to embrace their role in the maturing space of digital humanities publishing",
			logo: '/static/landing/expansive.png',
			type: 'Report',
			category: 'Digital Humanities',
			link: 'https://expansive.pubpub.org/',
		},
		{
			name: 'Frankenbook',
			description:
				'A collaborative, multimedia reading experiment with Mary Shelley’s classic novel',
			logo: '/static/landing/frankenbook.png',
			type: 'Book',
			category: 'Literature',
			link: 'https://frankenbook.org',
		},
	];
	const communityGrid = communities.map((community) => {
		return (
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
								The open-source, privacy-respecting, all-in-one collaborative
								publishing platform for communities small and large.
							</p>
							<h2>Manage, evolve & perfect your publishing process</h2>
							<div className="buttons">
								<a href="/community/create" className="custom-button black">
									Create your community
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
							As part of the{' '}
							<a href="https://www.knowledgefutures.org">
								<strong>Knowledge Futures Group</strong>
							</a>
							, we’re committed to making PubPub open and easily accessible to a wide
							range of groups. That means we’re committed to providing a free version
							of PubPub forever, releasing open-source code, and operating under
							non-profit, sustainable, researcher-friendly business models.
						</div>
						<div>
							<h3>Open Source</h3>
						</div>
						<div>
							<a className="git" href="https://github.com/pubpub/pubpub">
								<Icon icon="git-repo" /> pubpub
							</a>
							<a className="git" href="https://github.com/pubpub/pubpub-editor">
								<Icon icon="git-repo" /> pubpub-editor
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
								alt="You can see multiple users editing at the same time."
							/>
						</div>
						<div>
							<p className="feature-number">02</p>
							<ul>
								<li key="02-01">Easy multi-file imports</li>
								<li key="02-02">Complex-content friendly</li>
								<li key="02-03">Markdown, Word, and LaTeX</li>
							</ul>
						</div>
						<div>
							<h4>Embed rich multimedia in your publication</h4>
							<img
								src="/static/landing/multimedia.png"
								alt="You can see multiple users editing at the same time."
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
							<h3>Case Study</h3>
						</div>
						<div>
							<div className="logo">
								<img
									src="/static/landing/mitp_light.png"
									alt="the Mit Press colophon, designed by Muriel Cooper in 1964"
								/>
							</div>
							<p>
								Learn how <strong>the MIT Press</strong> uses PubPub for
								collaborative community review on projects like{' '}
								<a href="https://bookbook.pubpub.org/data-feminism">
									Data Feminism
								</a>
								, <a href="https://thegooddrone.pubpub.org">The Good Drone</a>, and{' '}
								<a href="https://bookbook.pubpub.org/annotation">Annotation</a>.
							</p>
							<div className="buttons">
								<a
									href="https://notes.knowledgefutures.org/pub/ek9zpak0"
									className="custom-button light"
								>
									Read more
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
							<h3>Communities</h3>
						</div>
						<div>
							<p>
								Communities are publishing groups focused on a particular topic,
								theme, or expertise. They can be a university press or a single
								monograph; they can be a journal, research group, or conference. You
								can start your community or browse any of the existing PubPub
								communities today.
							</p>
							<div className="community-grid">{communityGrid}</div>
							<div className="buttons">
								<a href="/explore" className="custom-button">
									Explore all communities
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
							<h4>Start experimenting today</h4>
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
								With PubPub, one tool supports your entire content workflow from
								drafting to review, publication, and reader engagement. Work
								efficiently, flexibly, and collaboratively to better support
								knowledge creation and dissemination.
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
