import React from 'react';
import { GridWrapper } from 'components';

require('./about.scss');

const About = function() {
	return (
		<div id="about-container">
			<GridWrapper containerClassName="narrow">
				<h1>Our Mission</h1>
				<h2>
					PubPub gives research communities of all stripes and sizes a simple, affordable,
					and nonprofit alternative to existing publishing models and tools.
				</h2>
				<p>
					Research is an iterative process filled with conversations, mistakes, unexpected
					collaborations, and exploration that never truly ends. That’s the fundamental
					insight behind PubPub: conducting research, drafting, reviewing, and publishing
					should be part of the same ongoing and collaborative process. We call sharing
					research in this way <i>community publishing</i>, and we believe it provides a
					number of important benefits.
				</p>
				<p>
					Publishing, disseminating, and getting feedback on research online is fast,
					inexpensive, and has the potential to reach many more people than traditional
					methods. When researchers collaborate the result is often{' '}
					<a href="http://advances.sciencemag.org/content/1/8/e1500211.full">
						more impactful research
					</a>
					. And, as the preprint model has demonstrated, publishing work early can lead to{' '}
					<a href="https://link.springer.com/article/10.1007/s40037-018-0451-8">
						more opportunities for feedback
					</a>{' '}
					and{' '}
					<a href="https://jamanetwork.com/journals/jama/fullarticle/2670247">
						higher publication and citation rates.
					</a>
				</p>
				<p>
					But there are larger benefits to choosing a community publishing model as well.
					PubPub users like{' '}
					<a href="https://www.responsivescience.org">Responsive Science</a> have shown
					that a community-driven approach can also invite people likely to be affected by
					research into the knowledge creation process. As a result, research becomes more
					transparent, more inclusive, and ultimately, more trusted and impactful. At a
					time when{' '}
					<a href="http://www.pewresearch.org/fact-tank/2018/07/26/most-americans-say-higher-ed-is-heading-in-wrong-direction-but-partisans-disagree-on-why/">
						trust in academic institutions is declining
					</a>
					, there is no more important metric.
				</p>
				<p>
					In the last several years, many once-independent publishing tools have been
					consolidated into closed platforms. We believe researchers need open-source,
					academically supported, end-to-end alternatives to these proprietary platforms
					and publishing models. In our vision of the future, universities and researchers
					play a lead role in building and maintaining our knowledge systems, reclaiming
					territory that was ceded to proprietary solutions.
				</p>
				<p>
					PubPub supports each part of the publishing process, from drafting documents,
					conducting peer review, and hosting entire journal and book websites, to
					collecting and displaying reader feedback and analytics. PubPub is
					nonprescriptive and flexible, so that authors can freely experiment with
					different types of processes and tools, including overlay journals, open access
					publishing, and beyond. The discovery and adoption of more sustainable,
					effective publishing models will be led by researchers, authors, and readers—by{' '}
					<i>you</i>!
				</p>
				<p>
					With strong institutional support from{' '}
					<a href="http://mitpress.mit.edu/kfg">MIT’s Knowledge Futures Group</a>, PubPub
					isn’t going anywhere. We’re committed to supporting open access, open-source,
					and new experimental publishing models, and to{' '}
					<a href="https://github.com/pubpub">releasing all of our code</a> open-source.
					By offering a flexible and sustainable alternative to commercial publishing
					technologies, PubPub aims to serve as a model of institutional investment in our
					systems for knowledge creation and sharing, one that supports the open
					publishing movement and encourages researchers to adopt open tools.
				</p>
				<p>
					<a href="https://www.pubpub.org/community/create">
						To get started, you can create a community today
					</a>{' '}
					with a few clicks.
				</p>
				<p>
					To support our mission and to learn more about community publishing, please{' '}
					<a href="http://eepurl.com/dyRqBr">sign up for our newsletter</a>.
				</p>
				<p>
					If you have questions or are interested in collaborating, get in touch directly
					at <a href="mailto:hello@pubpub.org">hello@pubpub.org</a>.
				</p>
				<p>—The PubPub Team</p>
			</GridWrapper>
		</div>
	);
};

export default About;
