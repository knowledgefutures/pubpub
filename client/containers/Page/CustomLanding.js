import React from 'react';
import PropTypes from 'prop-types';
import { generateAuthorString } from './customLandingUtils';

require('./customLanding.scss');

const propTypes = {
	pageData: PropTypes.object.isRequired,
	communityData: PropTypes.object.isRequired,
};

const CustomLanding = (props) => {
	const { pageData } = props;

	const getCollectionData = (title) => {
		return (
			props.communityData.collections.find((collection) => {
				return collection.title.toLowerCase().indexOf(title) > -1;
			}) || {}
		);
	};
	const getCollectionPubs = (id) => {
		return pageData.pubs
			.filter((pub) => {
				return pub.collectionPubs.find((collectionPub) => {
					return collectionPub.collectionId === id;
				});
			})
			.sort((foo, bar) => {
				if (foo.createdAt < bar.createdAt) {
					return 1;
				}
				if (foo.createdAt > bar.createdAt) {
					return -1;
				}
				return 0;
			})
			.slice(0, 3);
	};

	const panoramaData = getCollectionData('panorama');
	const cornucopiaData = getCollectionData('cornucopia');
	const steppingData = getCollectionData('stepping');
	const milestoneData = getCollectionData('milestone');
	const layoutData = [
		{
			collection: panoramaData,
			description: 'Overviews, Visions & Debates',
			pubs: getCollectionPubs(panoramaData.id),
		},
		{
			collection: cornucopiaData,
			description: 'Impact, Innovation & Knowledge Transfer',
			pubs: getCollectionPubs(cornucopiaData.id),
		},
		{
			collection: steppingData,
			description: ' Learning, Teaching & Communication',
			pubs: getCollectionPubs(steppingData.id),
		},
		{
			collection: milestoneData,
			description: 'Foundations, Theories & Methods',
			pubs: getCollectionPubs(milestoneData.id),
		},
	];

	const columnsData = [
		getCollectionData('history of data'),
		getCollectionData('visualization specials'),
		getCollectionData('data science as art'),
	];

	return (
		<div className="custom-landing-component">
			<div className="banner-bar grid">
				<span className="content">Recent Articles</span>
			</div>
			<div className="collections grid">
				{layoutData.map((blockData) => {
					return (
						<div className="block" key={blockData.collection.id}>
							<h2>{blockData.collection.title}</h2>
							<div className="subtitle">{blockData.description}</div>
							{blockData.pubs.map((pubData) => {
								return (
									<div className="pub" key={pubData.id}>
										<div className="authors">
											{generateAuthorString(pubData)}
										</div>
										<div className="title">{pubData.title}</div>
									</div>
								);
							})}
						</div>
					);
				})}
			</div>
			<div className="banner-bar grid">
				<span className="content">Columns</span>
			</div>
			<div className="columns">
				{columnsData.map((collection) => {
					return <div className="column">{collection.title}</div>;
				})}
			</div>
		</div>
	);
};

CustomLanding.propTypes = propTypes;
export default CustomLanding;
