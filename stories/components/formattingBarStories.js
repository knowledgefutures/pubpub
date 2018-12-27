import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { storiesOf } from '@storybook/react';
import FormattingBar from 'components/FormattingBar/FormattingBar';
import Editor from '@pubpub/editor';
import { plainDoc, imageDoc } from '../data';

require('components/FormattingBar/formattingBar.scss');

class EditorUnit extends Component {
	static propTypes = {
		useSimpleEditor: PropTypes.bool.isRequired,
		useSimpleFormatting: PropTypes.bool.isRequired,
	}

	constructor(props) {
		super(props);
		this.state = {
			editorChangeObject: {}
		};
	}

	render() {
		const editorStyle = {
			width: 'calc(100% / 3 - 1em)',
			border: '1px solid #CCC',
			borderRadius: '2px',
		};

		return (
			<div style={editorStyle}>
				<div style={{ background: '#F0F0F0', marginBottom: '0.5em' }}>
					<FormattingBar
						editorChangeObject={this.state.editorChangeObject}
						isReduced={this.props.useSimpleFormatting}
						hideMedia={this.props.useSimpleEditor}
					/>
				</div>
				<div style={{ padding: '0.25em' }}>
					<Editor
						placeholder="hello"
						onChange={(changeObject)=> {
							this.setState({ editorChangeObject: changeObject });
						}}
						initialContent={this.props.useSimpleEditor
							? plainDoc
							: imageDoc
						}
					/>
				</div>
			</div>
		);
	}
}


const wrapperStyle = { padding: '1em 0em', display: 'flex', justifyContent: 'space-evenly' };

storiesOf('Components/FormattingBar', module)
.add('default', () => (
	<div style={wrapperStyle}>
		<EditorUnit
			useSimpleEditor={false}
			useSimpleFormatting={false}
		/>
		<EditorUnit
			useSimpleEditor={false}
			useSimpleFormatting={true}
		/>
		<EditorUnit
			useSimpleEditor={true}
			useSimpleFormatting={true}
		/>
	</div>
));
