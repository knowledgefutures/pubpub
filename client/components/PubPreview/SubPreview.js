import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { PageContext } from 'components/PageWrapper/PageWrapper';

require('./subPreview.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	size: PropTypes.string.isRequired,
};

/* This component is a temporary placeholder until we have */
/* more capability to link pubs into relationships */
const SubPreview = function(props) {
	const { pubData, size } = props;
	const { communityData } = useContext(PageContext);
	if (size !== 'minimal') {
		return null;
	}

	const subData = [
		{
			parentId: '4aa410e1-bbb2-4b49-b66d-2fd54074b60e',
			children: [
				{
					prefix: 'Commentary by:',
					elements: [
						{ text: 'Greg Crane', href: '/pub/123' },
						{ text: 'Evelyn Masterson', href: '/pub/123' },
						{ text: 'Don Rickle', href: '/pub/123' },
						{ text: 'Gerald Ford', href: '/pub/123' },
					],
				},
				{
					prefix: 'Rejoinder from:',
					elements: [{ text: 'M. Jordan', href: '/pub/123' }],
				},
			],
		},
		{
			parentId: '00f9aaaf-0468-4590-9b86-1a2bff4ffe57',
			children: [
				{
					prefix: 'Commentary by:',
					elements: [
						{ text: 'Greg Crane', href: '/pub/123' },
						{ text: 'Evelyn Masterson', href: '/pub/123' },
						{ text: 'Don Rickle', href: '/pub/123' },
						{ text: 'Gerald Ford', href: '/pub/123' },
					],
				},
				{
					prefix: 'Rejoinder from:',
					elements: [{ text: 'M. Jordan', href: '/pub/123' }],
				},
			],
		},
	];

	const elementStyle = { color: communityData.accentColorDark };
	return (
		<div className="sub-preview-component">
			{subData
				.filter((item) => {
					return item.parentId === pubData.id;
				})
				.map((parentItem) => {
					return parentItem.children.map((child) => {
						return (
							<div className="child" key={child.prefix}>
								<span className="prefix">{child.prefix}</span>
								{child.elements.map((element, index, array) => {
									return (
										<React.Fragment>
											<a
												key={element.text}
												className="element"
												href={element.href}
												style={elementStyle}
											>
												{element.text}
											</a>
											{index < array.length - 1 && <span>, </span>}
										</React.Fragment>
									);
								})}
							</div>
						);
					});
				})}
		</div>
	);
};

SubPreview.propTypes = propTypes;
export default SubPreview;
