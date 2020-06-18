import React from 'react';
import PropTypes from 'prop-types';

import { Icon, Menu, MenuItem } from 'components';
import { usePageContext } from 'utils/hooks';
import { pubUrl } from 'utils/canonicalUrls';

const propTypes = {
	children: PropTypes.node.isRequired,
	pubData: PropTypes.object.isRequired,
};

const getLinksForPub = (pubTitle, pubLink) => [
	{
		title: 'Twitter',
		icon: <Icon icon="twitter" />,
		url: `https://twitter.com/intent/tweet?url=${pubLink}&text=${pubTitle}`,
	},
	{
		title: 'Reddit',
		icon: <Icon icon="reddit" />,
		url: `https://reddit.com/submit?url=${pubLink}&title=${pubTitle}`,
	},
	{
		title: 'Facebook',
		icon: <Icon icon="facebook" />,
		url: `https://www.facebook.com/sharer.php?u=${pubLink}`,
	},
	{
		title: 'LinkedIn',
		icon: <Icon icon="linkedin" />,
		url: `https://www.linkedin.com/shareArticle?url=${pubLink}&title=${pubTitle}`,
	},
	{
		title: 'Email',
		icon: <Icon icon="envelope" />,
		url: `mailto:?subject=${pubTitle}&body=${pubLink}`,
	},
];

const Social = (props) => {
	const { children, pubData } = props;
	const { communityData } = usePageContext();
	const links = getLinksForPub(pubData.title, pubUrl(communityData, pubData));

	return (
		<Menu disclosure={children} placement="bottom-end" aria-label="Social sharing options">
			{links.map((link) => {
				return (
					<MenuItem
						key={link.title}
						icon={link.icon}
						text={link.title}
						href={link.url}
						target="_blank"
					/>
				);
			})}
		</Menu>
	);
};

Social.propTypes = propTypes;
export default Social;
