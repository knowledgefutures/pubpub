/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { storiesOf } from '@storybook/react';
import beautify from 'js-beautify';
import Diff from 'react-stylable-diff';
import Editor from '../src/index';
import testDocs from './initialDocs/renderTestDocs';
import { renderStatic, buildSchema } from '../src/utils';

require('./renderTest.scss');

const ServerEditor = (props) => {
	const schema = buildSchema();
	const serverHtml = ReactDOMServer.renderToStaticMarkup(
		renderStatic(schema, props.initialContent.content, props),
	);
	props.onChange(serverHtml);
	/* eslint-disable-next-line react/no-danger */
	return <div className="editor ProseMirror" dangerouslySetInnerHTML={{ __html: serverHtml }} />;
};

const RenderTest = (props) => {
	const [clientHtml, setClientHtml] = useState('');
	const [serverHtml, setServerHtml] = useState('');
	const beautifyOptions = {
		inline: [],
	};

	return (
		<div className="render-test">
			<h1>{props.title}</h1>
			<div className="grid">
				<div className="editor client">
					<Editor
						initialContent={props.doc}
						/* We set readOnly for table so table plugins don't muck with diff */
						isReadOnly={props.title === 'table'}
						onChange={(eco) => {
							setClientHtml(beautify.html(eco.view.dom.innerHTML, beautifyOptions));
						}}
					/>
				</div>
				<div className="editor server">
					<ServerEditor
						initialContent={props.doc}
						isReadOnly={false}
						// isServer={true}
						onChange={(html) => {
							setServerHtml(beautify.html(html, beautifyOptions));
						}}
					/>
				</div>
			</div>
			<div className="html">
				<Diff inputA={clientHtml} inputB={serverHtml} type="chars" />
			</div>
		</div>
	);
};

storiesOf('RenderTest', module).add('default', () => (
	<React.Fragment>
		{/* <div className="render-test" style={{ borderBottom: '1px solid black' }}>
			<h1>Example Structure</h1>
			<div className="grid">
				<div className="editor client">Client Render</div>
				<div className="editor server">Server render</div>
			</div>
			<div className="html">HTML Diff</div>
		</div> */}
		{Object.keys(testDocs).map((key) => {
			return <RenderTest key={key} title={key} doc={testDocs[key]} />;
		})}
	</React.Fragment>
));
