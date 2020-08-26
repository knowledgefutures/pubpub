import React from 'react';

require('./labelList.scss');

type Props = {
	pubData: any;
	discussionData: any;
};

const LabelList = (props: Props) => {
	const { pubData, discussionData } = props;
	const pubLabels = pubData.labels || [];
	const labelsById = {};
	pubLabels.forEach((label) => {
		labelsById[label.id] = label;
	});
	const discussionLabels = discussionData.labels || [];
	if (!discussionLabels.length) {
		return null;
	}
	return (
		<div className="label-list-component">
			{discussionLabels
				.sort((foo, bar) => {
					if (labelsById[foo].title < labelsById[bar].title) {
						return -1;
					}
					if (labelsById[foo].title > labelsById[bar].title) {
						return 1;
					}
					return 0;
				})
				.map((labelId) => {
					const label = labelsById[labelId];
					return (
						<span
							key={labelId}
							className="bp3-tag"
							style={{ backgroundColor: label.color }}
						>
							{label.title}
						</span>
					);
				})}
		</div>
	);
};
export default LabelList;
