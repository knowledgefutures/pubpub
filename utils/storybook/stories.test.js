/**
 * @jest-environment jsdom
 */
import Adapter from 'enzyme-adapter-react-16';
import Enzyme, { mount } from 'enzyme';
import initStoryShots, { renderWithOptions } from '@storybook/addon-storyshots';

Enzyme.configure({ adapter: new Adapter() });

initStoryShots({ test: renderWithOptions({ renderer: mount }) });
