import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';

require('./subPreview.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	size: PropTypes.string.isRequired,
};

/* This component is a temporary placeholder until we have */
/* more capability to link pubs into relationships */
const SubPreview = function(props) {
	const { pubData, size } = props;
	const { communityData } = usePageContext();
	if (size !== 'minimal') {
		return null;
	}

	const subData = [
		{
			parentId: '6fdaa9de-a01b-428f-b750-592bfbdc8bd0',
			children: [
				{
					prefix: '',
					elements: [{ text: 'Supplementary Materials', href: '/pub/3cfhdct9/' }],
				},
			],
		},
		{
			parentId: '4aa410e1-bbb2-4b49-b66d-2fd54074b60e',
			children: [
				{
					prefix: 'Commentary:',
					elements: [
						{ text: 'Rodney Brooks', href: '/pub/' },
						{ text: 'Candes, Duchi, and Sabatti', href: '/pub/' },
						{ text: 'Greg Crane', href: '/pub/' },
						{ text: 'David Donoho', href: '/pub/' },
						{ text: 'Maria Fasli', href: '/pub/' },
						{ text: 'Barbara Grosz', href: '/pub/' },
						{ text: 'Andrew Lo', href: '/pub/' },
						{ text: 'Maja Mataric', href: '/pub/' },
						{ text: 'Brendan McCord', href: '/pub/' },
						{ text: 'Max Welling', href: '/pub/' },
						{ text: 'Rebecca Willett', href: '/pub/' },
					],
				},
				{
					prefix: 'Rejoinder:',
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
		{
			parentId: 'f06c6e61-5f54-4739-8012-8954a55c4d38',
			children: [
				{
					prefix: 'Commentary by:',
					elements: [
						{ text: 'Rodney Brooks', href: '/pub/tgl23krp' },
						{
							text: 'Emmanuel Candes, John Duchi, and Chiara Sabatti',
							href: '/pub/djb16hzl',
						},
						{ text: 'Greg Crane', href: '/pub/kyzf7fjv' },
						{ text: 'David Donoho', href: '/pub/rim3pvdw' },
						{ text: 'Maria Fasli', href: '/pub/pqddq8u5' },
						{ text: 'Barbara Grosz', href: '/pub/wiq01ru6' },
						{ text: 'Andrew Lo', href: '/pub/pjebp7io' },
						{ text: 'Maja Mataric', href: '/pub/esfh2s4w' },
						{ text: 'Brendan McCord', href: '/pub/4s0269ne' },
						{ text: 'Max Welling', href: '/pub/u2econxe' },
						{ text: 'Rebecca Willett', href: '/pub/plto69bh' },
					],
				},
				{
					prefix: 'Rejoinder from:',
					elements: [{ text: 'Michael I. Jordan', href: '/pub/2imtstfu' }],
				},
			],
		},
		{
			parentId: '5c5f0525-dd50-4ea2-886a-7db64633131a',
			children: [
				{
					prefix: '',
					elements: [{ text: 'Supplementary Materials', href: '/pub/dno70rhw' }],
				},
			],
		},
		{
			parentId: 'fc14bf2d-fb55-4cea-9291-a66fd4ab5c7d',
			children: [
				{
					prefix: '',
					elements: [{ text: 'Supplementary Materials', href: '/pub/tn4j86t1' }],
				},
			],
		},
		{
			parentId: 'c871f9e0-37de-41eb-b8cf-8642f48c975e',
			children: [
				{
					prefix: 'Commentary by:',
					elements: [
						{ text: 'Margo J. Anderson', href: '/pub/ofozx8tv' },
						{ text: 'Thomas R. Belin', href: '/pub/5rdl7fyi' },
						{ text: 'Ray Chambers', href: '/pub/n6sp95q1' },
						{ text: 'Constance F. Citro', href: '/pub/ec742hpw' },
						{ text: 'Reynolds Farley', href: '/pub/rosc6trb' },
						{ text: 'Howard Hogan', href: '/pub/z4115tbw' },
						{ text: 'Karen Kafadar', href: '/pub/pfji5iif' },
						{ text: 'Dudley L. Poston, Jr.', href: '/pub/m0lpwb4x' },
						{ text: 'Dennis Trewin', href: '/pub/4v4jnt6g' },
					],
				},
				{
					prefix: 'Rejoinder from:',
					elements: [{ text: 'Teresa A. Sullivan', href: '/pub/3saxaqb8' }],
				},
			],
		},
		{
			parentId: '6ed64b30-faeb-4c8c-98ca-7326b4d78815',
			children: [
				{
					prefix: 'Commentary by:',
					elements: [
						{ text: 'Shawn Bushway', href: '/pub/dudgcmk3' },
						{ text: 'Alexandra Chouldechova', href: '/pub/xlfiu7za' },
						{ text: 'Sarah Desmarais', href: '/pub/60jfy7hm' },
						{ text: 'Brandon L. Garrett', href: '/pub/p0wzaz31' },
						{ text: 'Eugenie Jackson and Christina Mendoza', href: '/pub/hzwo7ax4/' },
						{ text: 'Greg Ridgeway', href: '/pub/vu6rc1yv' },
					],
				},
				{
					prefix: 'Rejoinder from:',
					elements: [
						{
							text: 'Cynthia Rudin, Caroline Wang, and Beau Coker',
							href: '/pub/8jy98s9q/',
						},
					],
				},
			],
		},
		{
			parentId: 'e38165eb-ef5f-463e-9ddc-e7ae48a9a4aa',
			children: [
				{
					prefix: '',
					elements: [{ text: 'Supplementary Materials', href: '/pub/3howud7k/' }],
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
								{child.prefix && (
									<span className="prefix" style={elementStyle}>
										{child.prefix}
									</span>
								)}
								{child.elements.map((element, index, array) => {
									return (
										<React.Fragment key={element.text}>
											<a className="element" href={element.href}>
												{element.text}
											</a>
											{index < array.length - 1 && (
												<span style={elementStyle}> · </span>
											)}
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
