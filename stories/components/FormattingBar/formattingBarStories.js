import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { storiesOf } from '@storybook/react';
import FormattingBar from 'components/FormattingBarNew/FormattingBar';
import Editor from '@pubpub/editor';
import { plainDoc, fullDoc } from 'data';

class EditorUnit extends Component {
	static propTypes = {
		hideMedia: PropTypes.bool.isRequired,
		hideBlocktypes: PropTypes.bool.isRequired,
		hideExtraFormatting: PropTypes.bool.isRequired,
		isSmall: PropTypes.bool.isRequired,
	};

	constructor(props) {
		super(props);
		this.state = {
			editorChangeObject: null,
		};
	}

	render() {
		const editorStyle = {
			width: this.props.isSmall ? 'calc(100% / 3 - 1em)' : 'calc(100%)',
			marginBottom: '1em',
			border: '1px solid #CCC',
			borderRadius: '2px',
		};

		return (
			<div style={editorStyle}>
				<div style={{ background: '#F0F0F0', marginBottom: '0.5em' }}>
					{this.state.editorChangeObject && (
						<FormattingBar
							editorChangeObject={this.state.editorChangeObject}
							hideMedia={this.props.hideMedia}
							hideBlocktypes={this.props.hideBlocktypes}
							hideExtraFormatting={this.props.hideExtraFormatting}
							isSmall={this.props.isSmall}
						/>
					)}
				</div>
				<div style={{ padding: '0.25em', height: '250px', overflow: 'scroll' }}>
					<Editor
						placeholder="hello"
						onChange={(changeObject) => {
							this.setState({ editorChangeObject: changeObject });
						}}
						initialContent={this.props.hideMedia ? plainDoc : fullDoc}
					/>
				</div>
			</div>
		);
	}
}

const wrapperStyle = {
	padding: '1em 1em',
	display: 'flex',
	justifyContent: 'space-between',
	flexWrap: 'wrap',
};

storiesOf('components/FormattingBar', module).add('default', () => (
	<div style={wrapperStyle}>
		<EditorUnit
			hideMedia={false}
			hideBlocktypes={false}
			hideExtraFormatting={false}
			isSmall={false}
		/>
		<EditorUnit
			hideMedia={false}
			hideBlocktypes={false}
			hideExtraFormatting={true}
			isSmall={true}
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
