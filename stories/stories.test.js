/**
 * @jest-environment jsdom
 */
import Adapter from 'enzyme-adapter-react-16';
import Enzyme, { mount } from 'enzyme';
import initStoryShots, { renderWithOptions } from '@storybook/addon-storyshots';

Enzyme.configure({ adapter: new Adapter() });

const EXCLUDE_STORIES = [
	// This component contains a call to fetch in componentDidMount.
	// TODO(ian): create an importable fetch wrapper
	// TODO(ian): split PubOptionsAnalytics into data + presentation layers
	'PubOptionsAnalytics',
];

initStoryShots({
	// A regex to include stories in EXCLUDE_STORIES, using a negative
	// lookahead with a union of possible words separated by word boundaries
	// (the \b token). It would be nice if we could just give it a list :/
	storyKindRegex: new RegExp(
		// eslint-disable-next-line prefer-template
		'^(?!.*\\b(' + EXCLUDE_STORIES.join('|') + ')\\b).*',
	),
	test: renderWithOptions({ renderer: mount }),
});
