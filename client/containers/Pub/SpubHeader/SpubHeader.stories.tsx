import React from 'react';
import { storiesOf } from '@storybook/react';

import { SubmissionWorkflow } from 'types';
import { getEmptyDoc } from 'client/components/Editor';
import { initialHistoryData } from 'client/components/PubHistoryViewer/PubHistoryViewer.stories';

import SpubHeader from './SpubHeader';
import './SpubHeader.stories.scss';

const workflow: SubmissionWorkflow = {
	id: '12089e31h3f23bf-f23f23f23f2-f23f32bu234v23-f2323f',
	createdAt: '',
	updatedAt: '',
	enabled: true,
	title: 'A Submission Work-work-work-work-work-work-flow',
	collectionId: '',
	targetEmailAddress: '',
	acceptedText: getEmptyDoc(),
	declinedText: getEmptyDoc(),
	emailText: getEmptyDoc(),
	introText: getEmptyDoc(),
	instructionsText: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'paragraph',
				content: [
					{
						type: 'text',
						text: 'You gotta do a little dance to get into a pocket dimension. You know, like in Fringe. First go to the building from the tape, go to apartment 413, itsdangerous though. careful footing. In the middle of the room walk three steps forwad, step to the left. step to the right, walk backwards three steps, step	left, turn left 270 degrees. step forward',
					},
				],
			},
			{
				type: 'paragraph',
				content: [
					{
						type: 'text',
						text: 'If you have any questions, you can email the community admin at hello@institution.com, and could even contain a story about civiizations that have come and gone in the time it takes for a species to evolve past its own technological limtations. Do we really know what exists around us? There are phenomena that exists outside the visible spectrum which we may have no clear perception of.',
					},
				],
			},
		],
	},
};

storiesOf('containers/Pub/SpubHeader', module).add('default', () => (
	<SpubHeader
		pubData={{ submission: { submissionWorkflow: workflow } }}
		historyData={initialHistoryData}
		updateLocalData={() => {}}
	/>
));
