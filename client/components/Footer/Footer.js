import React from 'react';
import PropTypes from 'prop-types';

require('./footer.scss');

const propTypes = {
	isBasePubPub: PropTypes.bool.isRequired,
	isAdmin: PropTypes.bool.isRequired,
	socialItems: PropTypes.array.isRequired,
};

const Footer = function(props) {
	const links = props.isBasePubPub
		? [
			{ id: 1, title: 'pubpub@media.mit.edu', url: 'mailto:pubpub@media.mit.edu' },
			{ id: 2, title: 'Code', url: 'https://github.com/pubpub' },
			{ id: 3, title: 'About', url: '/about' },
			{ id: 4, title: 'Terms', url: '/tos' },
			// { id: 6, title: 'Help', url: 'https://meta.pubpub.org/help' },

		]
		: [
			{ id: 1, title: 'Dashboard', url: '/dashboard', adminOnly: true },
			...props.socialItems,
			{ id: 2, title: 'RSS', url: '/rss.xml' },
			{ id: 4, title: 'Terms', url: '/tos' },
			// { id: 6, title: 'Help', url: 'https://meta.pubpub.org/help' },
			{ id: 5, title: 'PubPub', url: 'https://www.pubpub.org' }
		];

	const wrapperClasses = props.isBasePubPub
		? 'base-pubpub'
		: 'accent-background accent-color';
	return (
		<div className={`footer-component ${wrapperClasses}`}>
			<div className="container">
				<div className="row">
					<div className="col-12">
						<ul>
							{links.filter((item)=> {
								return !item.adminOnly || props.isAdmin;
							}).map((link)=> {
								return (
									<li key={`footer-item-${link.id}`}>
										<a href={link.url}>
											{link.title}
										</a>
									</li>
								);
							})}
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

Footer.propTypes = propTypes;
export default Footer;
