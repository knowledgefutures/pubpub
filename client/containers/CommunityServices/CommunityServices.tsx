import React, { useState } from 'react';
import { Button, InputGroup, Intent, Tag, TextArea } from '@blueprintjs/core';

import { GridWrapper } from 'components';
import { apiFetch } from 'client/utils/apiFetch';

import ServiceOption from './ServiceOption';

require('./communityServices.scss');

const CommunityServices = () => {
	const services = [
		{
			title: 'Content Production',
			options: ['None', 'Low Volume', 'Medium Volume', 'High Volume'],
			tooltips: [
				'',
				'~10 articles or chapters per year',
				'~20-30 articles or chapters per year',
				'50+ articles or chapters per year',
			],
			prices: ['$0', '$4,000 - $5,000', '$9,000 - $15,000', '$20,000+'],
			initOption: 0,
			description:
				'We ingest finalized, copyedited content into PubPub for you, assure its quality, implement necessary revisions, assign DOIs (if applicable), and implement any Pub design. Content on PubPub does not require typesetting and can be exported to many different file types, including PDF.',
		},
		{
			title: 'Copyediting',
			options: {
				None: ['Requires Content Production'],
				'Low Volume': ['Do not Include', 'Include'],
				'Medium Volume': ['Do not Include', 'Include'],
				'High Volume': ['Do not Include', 'Include'],
			},
			prices: {
				None: ['$0'],
				'Low Volume': ['$0', '$2,000 - $3,000'],
				'Medium Volume': ['$0', '$3,000 - $5,000'],
				'High Volume': ['$0', '$5,000+'],
			},
			initOption: 0,
			description:
				'Our copyeditors edit and format articles for grammar, clarity, and style requirements. Average turnaround time: 1 week.',
		},
		{
			title: 'Embedded Managing Editor',
			options: {
				None: ['Requires Content Production'],
				'Low Volume': ['Do not Include', 'Include'],
				'Medium Volume': ['Do not Include', 'Include'],
				'High Volume': ['Do not Include', 'Include'],
			},
			prices: {
				None: ['$0'],
				'Low Volume': ['$0', '$5,000'],
				'Medium Volume': ['$0', '$10,000 - $15,000'],
				'High Volume': ['$0', '$20,000+'],
			},
			initOption: 0,
			description:
				'We assign one person from our team to work as your dedicated production point person. This work includes regular calls, communication with authors, and providing general publication strategy as well as insights. Teams who find this service most useful include those that publish on a regular basis but do not have the internal bandwidth to manage these activities nor the budget to hire an additional full-time person to do so.',
		},
		{
			title: 'Text to Audio',
			options: ['None', 'Low Volume', 'Medium Volume', 'High Volume'],
			tooltips: [
				'',
				'~10 articles or chapters per year',
				'~20-30 articles or chapters per year',
				'50+ articles or chapters per year',
			],
			prices: ['$0', '$1,500 - $2,000', '$3,000 - $4,000', '$5,000+'],
			initOption: 0,
			description:
				"We'll enhance your community's accessibility and expand its reach by generating crisp audio versions of your text with support for 100+ natural sounding synthetic narration voices in 70+ languages. Our editors will proof listen to ensure high quality sound delivery and accuracy.",
		},
		{
			title: 'Archiving & Indexing',
			options: ['None', 'Low Volume', 'Medium Volume', 'High Volume'],
			tooltips: [
				'',
				'~10 articles or chapters per year',
				'~20-30 articles or chapters per year',
				'50+ articles or chapters per year',
			],
			prices: ['$0', '$2,500 - $3,000', '$4,000 - $5,000', '$6,000+'],
			initOption: 0,
			description:
				"We'll work in partnership to enhance discoverability of your publications with customizable XML transformation and, or project support for relevant A&I services. For example: PubMed Central, Web of Science, Scopus, EBSCOhost, ProQuest, HeinOnline, Directory of Open Access Journals (DOAJ), Directory of Open Access Books (DOAB), and others.",
		},
		{
			title: 'Interactives',
			options: ['Do not Include', 'Include'],
			prices: ['$0', '$500/interactive'],
			initOption: 0,
			description:
				'We work with you or directly with your authors to develop media and/or interactive elements to enhance your Community. Our focus is always on more effectively communicating the message(s) of your content.',
		},
		{
			title: 'OER Course Presentations',
			options: ['Do not Include', 'Include'],
			prices: ['$0', '$5,000 - $10,000 / presentation'],
			initOption: 0,
			description:
				"We'll provide technical and design support to convert curricula into interactive course presentations featuring interactive summaries, multiple-choice questions, videos, and various other H5P content types necessary to convey learning objectives.",
		},

		{
			title: 'Community Structure and Design',
			options: ['Do not Include', 'Include'],
			prices: ['$0', '$2,000 - $3,000'],
			initOption: 0,
			description:
				"We believe the content you publish (and how you want readers to understand and interact with it) should inform the structure and design of your community on PubPub. We'll work with you to understand your content—from traditional journal articles and books, to rviews, to video tutorials—in order to design a space that best supports your work.",
		},
		{
			title: 'Back File Import',
			options: ['Do not Include', 'Include'],
			prices: ['$0', '$1,000 - $5,000'],
			initOption: 0,
			description:
				'We help you migrate years of existing content into PubPub so that your existing publication can start its new phase on PubPub without losing its history and archives. This activity often also makes past work more discoverable and navigable for readers.',
		},
		{
			title: 'Training',
			options: ['Do not Include', 'Include'],
			prices: ['$0', '$500'],
			initOption: 0,
			description:
				"We offer two recorded training sessions of up to 90 minutes on a one-off or ongoing (yearly) basis for your team. These sessions cover basics on how to use PubPub, specifics on your group's workflow, and leave plenty of time for your team to practice and ask questions.",
		},

		{
			title: 'Branding',
			options: ['Do not Include', 'Include'],
			prices: ['$0', '$4,500 - $5,500'],
			initOption: 0,
			description:
				'Our design team will develop a brand and design scheme for your Community. Groups that find this most useful are those who are starting a new publication, such as a journal, and need a brand to inform the design and appearance of their PubPub Community and other possible communication elements, such as a newsletter.',
		},
		{
			title: 'Knowledge Futures Membership',
			options: ['None', 'Supporter', 'Contributor', 'Network'],
			prices: ['$0', '$60', '$1,150 - $12,500', 'Custom'],
			initOption: 2,
			description: (
				<React.Fragment>
					PubPub is built and maintained by{' '}
					<a href="https://www.knowledgefutures.org">Knowledge Futures Group</a>, a
					nonprofit organization dedicated to building public knowledge infrastructure.
					KFG is supported by Members.{' '}
					<a href="https://www.knowledgefutures.org/membership">Membership</a> allows
					individuals and organizations of all sizes to support open infrastructure;
					receive discounts on Community Services; receive additional support on our
					products; meet and share ideas with other innovative knowledge communities; and
					join a community passionate about the future of knowledge infrastructure and its
					development.
				</React.Fragment>
			),
			discounts: [
				'0% discount on all services',
				'5% discount on all services',
				'10% discount on all services',
				'15% discount on all services',
			],
		},
	];
	const [formDetails, setFormDetails] = useState(
		services.reduce((prev, curr) => {
			return { ...prev, [curr.title]: curr.initOption };
		}, {}),
	);
	const [details, setDetails] = useState('');
	const [email, setEmail] = useState('');
	const [submitSuccess, setSubmitSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const setVal = (newVal) => {
		setFormDetails({ ...formDetails, ...newVal });
	};
	const onSubmit = () => {
		setIsLoading(true);
		const selections = Object.keys(formDetails).reduce((prev, curr) => {
			const service = services.find((s) => {
				return s.title === curr;
			});
			if (!service) {
				return prev;
			}
			const selectedOptionIndex = formDetails[curr];
			const isContentProductionDependent =
				curr === 'Embedded Managing Editor' || curr === 'Copyediting';
			const currentContentProductionSelection =
				services[0].options[formDetails['Content Production']];
			const options = isContentProductionDependent
				? service.options[currentContentProductionSelection]
				: service.options;
			const prices = isContentProductionDependent
				? service.prices[currentContentProductionSelection]
				: service.prices;

			return `${prev}\n\t\t\t${curr}: ${options[selectedOptionIndex]}, ${prices[selectedOptionIndex]}`.trim();
		}, '');

		return apiFetch('/api/communityServices', {
			method: 'POST',
			body: JSON.stringify({
				contactEmail: email,
				selections,
				additionalDetails: details,
			}),
		})
			.then(() => {
				setEmail('');
				setDetails('');
				setIsLoading(false);
				setSubmitSuccess(true);
				setTimeout(() => {
					setSubmitSuccess(false);
				}, 5000);
			})
			.catch((err) => {
				console.error(err);
				setIsLoading(false);
			});
	};

	const examples = [
		{
			url: 'https://hdsr.mitpress.mit.edu/',
			img: '/static/landing/hdsr.png',
			title: 'Harvard Data Science Review',
			source: 'Harvard Data Science Initiative',
		},
		{
			url: 'https://mit-serc.pubpub.org/',
			img: '/static/landing/serc.png',
			title: 'The MIT Case Studies in Social and Ethical Responsibilities of Computing',
			source: 'MIT Schwarzman College of Computing',
		},
		{
			quote: (
				<React.Fragment>
					"The amazing partnership and expertise of the PubPub team have allowed our
					editors to work with our authors in exciting new ways. They've helped us to
					develop works in progress, offer supplements and updates to traditionally
					published books, and produce enhanced digital editions (such as{' '}
					<a href="https://www.frankenbook.org/">Frankenbook</a>) with innovative features
					to support teaching and learning. The future of publishing is here, and PubPub
					is helping us to take advantage of all that the digital medium can offer."
				</React.Fragment>
			),
			source: 'Gita Manaktala, Editorial Director, MIT Press',
		},

		{
			quote: (
				<React.Fragment>
					"PubPub has been the ideal technology publishing partner for{' '}
					<i>Harvard Data Science Review</i> since launching in 2019. The talented team is
					flexible, easy to work with, and always aligned with our goals and what we are
					trying to accomplish."
				</React.Fragment>
			),
			source: 'Rebecca McLeod, Managing Director, Harvard Data Science Review',
		},
		{
			url: 'https://tmb.apaopen.org/',
			img: '/static/landing/tmb.png',
			title: 'Technology, Mind, and Behavior',
			source: 'American Physcological Association',
		},
		{
			url: 'https://phone-and-spear.pubpub.org/',
			img: '/static/landing/ps.png',
			title: 'Phone & Spear',
			source: 'Goldsmiths Press',
		},
		{
			quote: '"The PubPub team is bringing academic publishing into the 21st century. For decades I have been hoping to embed interactivity into figures and tables, and for the first time in my career I was able to do so with PubPub. The team\'s innovation and experience made for an incredible collaboration."',
			source: 'Jeremy Bailenson, Author, "A Theoretical Argument for the Causes of Zoom Fatigue"',
		},

		{
			quote: '"Dawit and the PubPub team have been great in helping our article to be more interactive and exciting. Their expertise and open-minded approach have allowed us to present our work in a way that engages much more with our readers. Collaborating with the PubPub team has been a smooth and enriching experience, where we learned and experimented together with great fun!"',
			source: 'Silvio Carta,  Author, "Self-Organizing Floor Plans"',
		},
		{
			url: 'https://jbt.pubpub.org/',
			img: '/static/landing/jbt.png',
			title: 'Journal of Biomolecular Techniques',
			source: 'Association of Biomolecular Resource Facilities',
		},
		{
			url: 'https://contours.pubpub.org',
			img: '/static/landing/contours.png',
			title: 'Contours Collaborations',
			source: 'Vanderbilt university',
		},
		{
			quote: '"PubPub has helped us transform the way we display and share scholarly works with the research community. The editorial boards of the open access journals that we engage with appreciate the option to embed interactive content and data visualizations into the body of a scholarly article.  Catherine and the PubPub team were incredibly responsive and fun to work with, and were also open to our feedback on platform development. In our experience, PubPub is the clear leader in next-generation academic publishing."',
			source: 'Agnes B. Gambill, J.D., LLM',
		},
	];
	return (
		<div id="community-services-container">
			<GridWrapper containerClassName="narrow">
				<h1>Community Services</h1>
				<p className="description top">
					PubPub is free to use. For groups that want personalized support we offer
					production, training, and strategy services for building high quality, effective
					publishing communities.
				</p>
				<p>
					For those looking to structure and operate their PubPub Community on their own,
					check out our{' '}
					<a href="https://help.pubpub.org/getting-started">Getting Started guide</a>!
				</p>
				<div className="option-form">
					<div className="title">To get started, tell us about your project</div>
					<p className="description">
						We will work with you to identify exactly what your community needs. Below
						is our Community Services menu along with estimated costs. As a starting
						point for our conversation, please select the options you're considering and
						submit the form. We'll then be in touch to schedule a call.
					</p>
					{services.map((service, index) => {
						if (index === 1 || index === 2) {
							const currentContentProductionSelection =
								services[0].options[formDetails['Content Production']];
							return (
								<ServiceOption
									{...service}
									key={service.title}
									setVal={setVal}
									options={service.options[currentContentProductionSelection]}
									prices={service.prices[currentContentProductionSelection]}
								/>
							);
						}
						// @ts-ignore
						return <ServiceOption {...service} key={service.title} setVal={setVal} />;
					})}

					<div className="title">Additional Details</div>
					<TextArea
						fill
						growVertically={true}
						large={true}
						placeholder="Tell us anything else you’d like us to know (e.g. timeline, content types, file types, links to example content, ...)"
						value={details}
						onChange={(evt) => {
							setDetails(evt.target.value);
						}}
					/>
					<div className="title">Contact Email *</div>
					<InputGroup
						placeholder="you@email.com..."
						value={email}
						required
						onChange={(evt) => {
							setEmail(evt.target.value);
						}}
					/>

					<div className="success-row">
						<Button
							className="button"
							intent={Intent.SUCCESS}
							text="Send Details"
							disabled={!email.includes('@')}
							onClick={onSubmit}
							loading={isLoading}
						/>
						{submitSuccess && (
							<div className="tag-wrapper">
								<Tag icon="tick" intent={Intent.SUCCESS} minimal>
									Submitted! We'll be in touch shortly.
								</Tag>
							</div>
						)}
					</div>
				</div>
				<p className="mitops">
					For publishing services such as peer-review, copyediting, and research support,
					we partner with MITops. The{' '}
					<a href="https://mitpress.mit.edu/mitops/">
						full list of services offered by MITops
					</a>{' '}
					is available on their site. Please{' '}
					<a href="https://mitpress.mit.edu/contact-us/">contact them directly</a> to
					inquire about their offering.
				</p>
				<h2>See what we can do together!</h2>
				<p>
					Browse some of our previous and ongoing Community Services projects as well as
					testimonials from recent collaborators.
				</p>
				<div className="grid-wrapper">
					{examples.map((example) => {
						return (
							<div className="example" key={example.title || example.source}>
								{!!example.title && (
									<React.Fragment>
										<a href={example.url}>
											<img
												className="example-img"
												src={example.img}
												alt={example.title}
											/>
										</a>
										<a href={example.url} className="hoverline">
											<div className="example-title">{example.title}</div>
										</a>
										<div className="example-source">{example.source}</div>
									</React.Fragment>
								)}
								{!example.title && (
									<React.Fragment>
										<div className="testimonial" key={example.source}>
											<div className="testimonial-quote">{example.quote}</div>
											<div className="testimonial-source">
												— {example.source}
											</div>
										</div>
									</React.Fragment>
								)}
							</div>
						);
					})}
				</div>
			</GridWrapper>
		</div>
	);
};

export default CommunityServices;
