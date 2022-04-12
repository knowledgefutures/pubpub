import React from 'react';
import { GridWrapper } from 'components';

require('./about.scss');

const About = function () {
	return (
		<div id="about-container">
			<GridWrapper containerClassName="narrow">
				<h1>Our Mission</h1>
				<h2>PubPub makes knowledge creation accessible to everyone.</h2>
				<p>
					PubPub supports over three thousand communities, from peer-reviewed scholarly
					journals and books to novel community publishing experiments, and everything in
					between. These communities are created and maintained by university presses,
					society publishers, library publishers, independent scholar-led publishers,
					academic departments, research labs, ad-hoc communities, individuals, and many
					others. PubPub provides infrastructure for each part of the publishing process,
					from drafting documents, conducting peer review, and hosting entire journal and
					book websites to collecting and displaying reader feedback and analytics.
				</p>
				<p>
					You can get started now by{' '}
					<a href="/community/create">creating your community</a>.
				</p>
				<h2>Features, Benefits, and Tradeoffs</h2>
				<p>
					PubPub is an open-source, hosted, free-to-use content management system designed
					to help knowledge communities of all types collaboratively create and share
					knowledge online. PubPub’s flexible, extensible system allows communities to
					create the dynamic content that best represents their work, whether it’s a
					traditional academic journal, a book, a repository of interactive documents, a
					blog, all of the above, or something in between. If needed, PubPub then helps
					communities integrate their work into academic infrastructure like Crossref and
					Google Scholar without the need to remake it to conform to legacy expectations
					of how academic outputs are structured.
				</p>
				<p>
					PubPub is built for communities of all types, but may be ideal for you if your
					community:
				</p>
				<p>
					<ul>
						<li>Wants to create web-native, dynamic content.</li>
						<li>Wants to collaborate on content creation.</li>
						<li>
							Wants to integrate your content into academic systems and formats like
							Crossref, Google Scholar, and JATS XML with as little effort as
							possible.
						</li>
						<li>Doesn’t have high levels of technical expertise on-staff.</li>
						<li>
							Doesn’t want to manage your own servers and worry about updates, plugin
							compatibility, or users breaking layouts.
						</li>
					</ul>
				</p>
				<p>PubPub may not be ideal if your community:</p>
				<p>
					<ul>
						<li>
							Publishes primarily PDF content, or has an audience that primarily
							consumes content as PDF.
						</li>
						<li>
							Needs precise control over the look and feel of its website or its PDFs.
						</li>
						<li>
							Needs precise control over academic metadata or output formats like JATS
							XML.
						</li>
						<li>Needs or wants to self-host their technology.</li>
					</ul>
				</p>
				<p>
					To learn more about the features, benefits and tradeoffs of using PubPub, see
					our <a href="https://help.pubpub.org/getting-started">Getting Started guide</a>.
				</p>
				<h2>Technical Support</h2>
				<p>
					We offer forum-based, community support for all PubPub users. Feel free to post
					on our <a href="https://github.com/pubpub/pubpub/discussions">user forum</a> at
					any time. If you need more support, consider becoming a{' '}
					<a href="https://knowledgefutures.org/membership">KFG Member</a>. KFG
					Contributing Members and above receive email support, as well as strategy
					consultation and training from our team.
				</p>
				<p>
					For groups that want personalized support, we offer production, training, and
					strategy services for building high quality, effective publishing communities.
					Services include content production, editorial services, site design, back file
					import, training, interactive production, branding, and more.{' '}
					<a href="/community-services">
						Learn more about our Community Services offerings
					</a>
					.
				</p>
				<h2>Roadmap & Contribution</h2>
				<p>
					PubPub maintains a high-level public roadmap{' '}
					<a href="https://github.com/orgs/pubpub/projects/9">on GitHub</a>. To suggest a
					feature, report a bug, or inquire about contributing, start by browsing our{' '}
					<a href="https://github.com/pubpub/pubpub/issues">GitHub issues</a> or posting
					to our <a href="https://github.com/pubpub/pubpub/discussions">user forum</a>.
				</p>
				<h2>Mission, Values, and Sustainability</h2>
				<p>
					PubPub provides open-source infrastructure to publish knowledge credibly and
					tools to facilitate community participation. For-profit academic publishing
					models that mount paywalls to monopolize publicly funded research hinder the
					reach of public knowledge and thereby contradict the ultimate goal of its
					creators. At PubPub we value the creation of knowledge and advocate for the
					people that are contributing to our collective understanding.
				</p>
				<p>
					In the last several years, many once-independent publishing tools have been
					consolidated into closed platforms. We believe researchers need open-source,
					academically supported, end-to-end alternatives to these proprietary platforms
					and publishing models. In our vision of the future, knowledge communities play a
					lead role in building and maintaining our knowledge systems, reclaiming
					territory that was ceded to proprietary solutions.
				</p>
				<p>
					PubPub is built and maintained by the{' '}
					<a href="https://knowledgefutures.org">Knowledge Futures Group</a>, a nonprofit
					organization dedicated to building public knowledge infrastructure. KFG is
					governed by an independent board, and supported and driven by Members.{' '}
					<a href="https://knowledgefutures.org/membership">Membership</a> allows
					individuals and organizations of all sizes to support open infrastructure;
					receive discounts on Community Services; receive additional support on our
					products; meet and share ideas with other innovative knowledge communities; and
					join a community passionate about the future of knowledge infrastructure and its
					development. If you value PubPub, we encourage you to{' '}
					<a href="https://knowledgefutures.org/membership">become a KFG Member</a>.
				</p>
				<p>
					We believe that for PubPub to succeed, it must be sustainable for the long term.
					For us, sustainability means primarily being supported by mission-oriented
					revenue streams, rather than being grant and gift-supported or relying on
					ancillary revenue streams.{' '}
					<a href="https://notes.knowledgefutures.org/pub/oozjbyky">
						Learn more about our sustainability plans
					</a>
					.
				</p>
				<h2>Other Useful Resources</h2>
				<p>
					<ul>
						<li>
							<a href="/explore">Check out our Explore Page</a> for a curated list of
							some of the most interesting PubPub communities (and we're constantly on
							the lookout for new ones).{' '}
						</li>
						<li>
							<a href="https://help.pubpub.org">Visit our Help Site</a> for guides and
							reference materials for setting up and maintaining communities.
						</li>
						<li>
							<a href="https://knowledgefutures.us5.list-manage.com/subscribe?u=9b9b78707f3dd62d0d47ec03d&id=be26e45660">
								Subscribe to our our twice-monthly newsletter
							</a>{' '}
							for useful community and product updates.
						</li>
						<li>
							<a href="https://twitter.com/pubpub">Follow us on Twitter</a> for great
							examples of communities using PubPub effectively.
						</li>
						<li>
							<a href="https://github.com/pubpub/pubpub">
								Browse our GitHub Repository
							</a>{' '}
							to see our code, as well as the latest development activiy.
						</li>
						<li>
							If you have questions or are interested in collaborating, get in touch
							directly at{' '}
							<a href="mailto:hello@pubpub.org?subject=About+Page+Question">
								hello@pubpub.org
							</a>
							.
						</li>
					</ul>
				</p>
				<p>—The PubPub Team</p>
			</GridWrapper>
		</div>
	);
};

export default About;
