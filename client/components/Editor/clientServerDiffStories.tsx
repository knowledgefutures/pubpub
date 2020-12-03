/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React, { useState, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import { storiesOf } from '@storybook/react';
import beautify from 'js-beautify';
import Diff from 'react-stylable-diff';

import testDocs from 'utils/storybook/initialDocs/renderTestDocs';

import Editor from './Editor';
import { buildSchema } from './utils/schema';
import { renderStatic } from './utils/renderStatic';

require('./clientServerDiffStories.scss');

const ServerEditor = (props) => {
	const rendered = useRef();
	const schema = buildSchema();
	const serverHtml = ReactDOMServer.renderToStaticMarkup(
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ schema: Schema<"audio" | "ifra... Remove this comment to see the full error message
		renderStatic({ schema: schema, doc: props.initialContent }),
	);
	if (!rendered.current) {
		// @ts-expect-error ts-migrate(2322) FIXME: Type 'true' is not assignable to type 'undefined'.
		rendered.current = true;
		props.onChange(serverHtml);
	}
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
						// @ts-expect-error ts-migrate(2322) FIXME: Type '(eco: any) => void' is not assignable to typ... Remove this comment to see the full error message
						onChange={(eco) => {
							setClientHtml(beautify.html(eco.view.dom.innerHTML, beautifyOptions));
						}}
					/>
				</div>
				<div className="editor server">
					<ServerEditor
						initialContent={props.doc}
						isReadOnly={false}
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

storiesOf('Editor/clientServerDiff', module).add('default', () => (
	<React.Fragment>
		{Object.keys(testDocs).map((key) => {
			return <RenderTest key={key} title={key} doc={testDocs[key]} />;
		})}
	</React.Fragment>
));
