import React from 'react';
import Adapter from 'enzyme-adapter-react-16';
import Enzyme, { shallow } from 'enzyme';
import dataInitial from 'utils/storybook/data/dataInitial';
import { pubData, attributionsData } from 'utils/storybook/data';
import { generateMetaComponents } from '../ssr';

Enzyme.configure({ adapter: new Adapter() });
const defaultProps = {
	initialData: dataInitial,
	attributions: pubData.attributions,
	title: 'Test Pub',
};

const MetaComponents = (props) => <React.Fragment>{generateMetaComponents(props)}</React.Fragment>;

describe('generateMetaComponents', () => {
	it('generates citation_author metadata for every author WITHOUT a contributor role as their primary role', () => {
		const attributions = pubData.attributions.map((att) => ({ ...att }));
		attributions[0].roles = ['Editor'];
		attributions[1].roles = ['Test role', 'Editor'];

		const wrap = shallow(<MetaComponents {...defaultProps} attributions={attributions} />);
		expect(
			wrap.containsMatchingElement(<meta name="citation_author" content="Weiwei Hsu" />),
		).toBeFalsy();
		expect(
			wrap.containsMatchingElement(<meta name="citation_author" content="Hugh Dubberly" />),
		).toBeTruthy();
		expect(
			wrap.containsMatchingElement(<meta name="citation_author" content="Ian Reynolds" />),
		).toBeTruthy();
	});

	it('generates citation_editor metadata for every contributor WITH a contributor role as their primary role', () => {
		const attributions = pubData.attributions.map((att) => ({ ...att }));
		attributions[1].roles = ['Series Editor', 'Test role'];
		attributions[2].roles = ['Test role', 'Writing – Review & Editing'];

		const wrap = shallow(<MetaComponents {...defaultProps} attributions={attributions} />);
		expect(
			wrap.containsMatchingElement(<meta name="citation_editor" content="Weiwei Hsu" />),
		).toBeFalsy();
		expect(
			wrap.containsMatchingElement(<meta name="citation_editor" content="Hugh Dubberly" />),
		).toBeTruthy();
		expect(
			wrap.containsMatchingElement(<meta name="citation_editor" content="Ian Reynolds" />),
		).toBeFalsy();
	});

	it('generates the expected meta elements', () => {
		const props = {
			...defaultProps,
			attributions: [...attributionsData, ...pubData.attributions],
		};

		expect(generateMetaComponents(props as any)).toMatchInlineSnapshot(`
		Array [
		  <link
		    href="https://localhost/rss.xml"
		    rel="alternate"
		    title="Test Pub RSS Feed"
		    type="application/rss+xml"
		  />,
		  <title>
		    Test Pub
		  </title>,
		  <meta
		    content="Test Pub"
		    property="og:title"
		  />,
		  <meta
		    content="Test Pub"
		    name="twitter:title"
		  />,
		  <meta
		    content="Test Pub"
		    name="twitter:image:alt"
		  />,
		  <meta
		    content="Test Pub"
		    name="citation_title"
		  />,
		  <meta
		    content="Test Pub"
		    name="dc.title"
		  />,
		  <meta
		    content="Joi Ito's PubPub"
		    property="og:site_name"
		  />,
		  <meta
		    content="Joi Ito's PubPub"
		    name="citation_journal_title"
		  />,
		  <meta
		    content="https://localhost/login"
		    property="og:url"
		  />,
		  <meta
		    content="website"
		    property="og:type"
		  />,
		  <link
		    href="https://assets.pubpub.org/12e422ul/41507920476077.png"
		    rel="icon"
		    sizes="256x256"
		    type="image/png"
		  />,
		  Array [
		    <meta
		      content="Ian Reynolds"
		      name="citation_author"
		    />,
		    <meta
		      content="Travis Rich"
		      name="citation_author"
		    />,
		    <meta
		      content="Catherine Ahearn"
		      name="citation_author"
		    />,
		    <meta
		      content="Gabriel Stein"
		      name="citation_author"
		    />,
		    <meta
		      content="Joel Gustafson"
		      name="citation_author"
		    />,
		    <meta
		      content="Weiwei Hsu"
		      name="citation_author"
		    />,
		    <meta
		      content="Hugh Dubberly"
		      name="citation_author"
		    />,
		    <meta
		      content="Ian Reynolds"
		      name="citation_author"
		    />,
		  ],
		  Array [
		    <meta
		      content="Ian Reynolds"
		      name="dc.creator"
		    />,
		    <meta
		      content="Travis Rich"
		      name="dc.creator"
		    />,
		    <meta
		      content="Catherine Ahearn"
		      name="dc.creator"
		    />,
		    <meta
		      content="Gabriel Stein"
		      name="dc.creator"
		    />,
		    <meta
		      content="Joel Gustafson"
		      name="dc.creator"
		    />,
		    <meta
		      content="Weiwei Hsu"
		      name="dc.creator"
		    />,
		    <meta
		      content="Hugh Dubberly"
		      name="dc.creator"
		    />,
		    <meta
		      content="Ian Reynolds"
		      name="dc.creator"
		    />,
		  ],
		  Array [],
		  <meta
		    content="924988584221879"
		    property="fb:app_id"
		  />,
		  <meta
		    content="summary"
		    name="twitter:card"
		  />,
		  <meta
		    content="@pubpub"
		    name="twitter:site"
		  />,
		]
	`);
	});
});
