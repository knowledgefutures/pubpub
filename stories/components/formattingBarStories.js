import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { storiesOf } from '@storybook/react';
import FormattingBar from 'components/FormattingBar/FormattingBar';
import Editor from '@pubpub/editor';
import { plainDoc, fullDoc } from '../data';

require('components/FormattingBar/formattingBar.scss');

class EditorUnit extends Component {
	static propTypes = {
		hideMedia: PropTypes.bool.isRequired,
		hideBlocktypes: PropTypes.bool.isRequired,
		hideExtraFormatting: PropTypes.bool.isRequired,
		isSmall: PropTypes.bool.isRequired,
	}

	constructor(props) {
		super(props);
		this.state = {
			editorChangeObject: {}
		};
	}

	render() {
		const editorStyle = {
			width: this.props.isSmall
				? 'calc(100% / 3 - 1em)'
				: '100%',
			border: '1px solid #CCC',
			borderRadius: '2px',
		};

		return (
			<div style={editorStyle}>
				<div style={{ background: '#F0F0F0', marginBottom: '0.5em' }}>
					<FormattingBar
						editorChangeObject={this.state.editorChangeObject}
						hideMedia={this.props.hideMedia}
						hideBlocktypes={this.props.hideBlocktypes}
						hideExtraFormatting={this.props.hideExtraFormatting}
						isSmall={this.props.isSmall}
					/>
				</div>
				<div style={{ padding: '0.25em' }}>
					<Editor
						placeholder="hello"
						onChange={(changeObject)=> {
							this.setState({ editorChangeObject: changeObject });
						}}
						initialContent={this.props.hideMedia
							? plainDoc
							: fullDoc
						}
					/>
				</div>
			</div>
		);
	}
}


const wrapperStyle = { padding: '1em 0em', display: 'flex', justifyContent: 'space-evenly', flexWrap: 'wrap' };

storiesOf('Components/FormattingBar', module)
.add('default', () => (
	<div style={wrapperStyle}>
		<EditorUnit
			hideMedia={false}
			hideBlocktypes={false}
			hideExtraFormatting={false}
			isSmall={false}
		/>
		<EditorUnit
			hideMedia={false}
			hideBlocktypes={true}
			hideExtraFormatting={true}
			isSmall={true}
		/>
		<EditorUnit
			hideMedia={true}
			hideBlocktypes={true}
			hideExtraFormatting={true}
			isSmall={true}
		/>
	</div>
));
