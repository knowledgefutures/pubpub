import React, { Component } from 'react';
import { Menu, MenuItem } from '@blueprintjs/core';

import { Icon } from 'components';

import MediaImage from './MediaImage';
import MediaVideo from './MediaVideo';
import MediaAudio from './MediaAudio';
import MediaFile from './MediaFile';
import MediaIframe from './MediaIframe';
import MediaYoutube from './MediaYoutube';
import MediaCodepen from './MediaCodepen';
import MediaVimeo from './MediaVimeo';
import MediaSoundcloud from './MediaSoundcloud';
import MediaGithub from './MediaGithub';
import MediaTwitter from './MediaTwitter';

require('./media.scss');

type Props = {
	onInsert: (...args: any[]) => any;
	isSmall: boolean;
	editorChangeObject: any;
};

type State = any;

class Media extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			activeItem: 'Image',
		};
		this.handleInsert = this.handleInsert.bind(this);
	}

	handleInsert(insertType, insertData) {
		const insertFunctions = this.props.editorChangeObject.insertFunctions || {};
		insertFunctions[insertType](insertData);
		this.props.editorChangeObject.view.focus();
	}

	render() {
		const files = [
			{ text: 'Image', icon: 'media' },
			{ text: 'Video', icon: 'video' },
			{ text: 'Audio', icon: 'volume-up' },
			{ text: 'Other', icon: 'document' },
		];
		const apps = [
			{ text: 'Iframe', icon: 'application' },
			{ text: 'YouTube', icon: 'youtube' },
			{ text: 'Twitter', icon: 'twitter' },
			{ text: 'Codepen', icon: 'codepen' },
			{ text: 'Vimeo', icon: 'vimeo' },
			{ text: 'SoundCloud', icon: 'soundcloud' },
			{ text: 'GitHub Gist', icon: 'github' },
		];
		const activeItem = this.state.activeItem;
		const componentProps = {
			onInsert: this.props.onInsert,
			isSmall: this.props.isSmall,
			editorChangeObject: this.props.editorChangeObject,
		};
		return (
			<div className="formatting-bar_media-component">
				<div className="options">
					<Menu>
						<li className="bp3-menu-header">
							<h6>Files</h6>
						</li>
						{files.map((file) => {
							return (
								<MenuItem
									key={file.text}
									text={file.text}
									icon={<Icon icon={file.icon} iconSize={30} useColor={true} />}
									active={activeItem === file.text}
									onClick={() => {
										this.setState({ activeItem: file.text });
									}}
								/>
							);
						})}
						<li className="bp3-menu-header">
							<h6>Apps</h6>
						</li>
						{apps.map((app) => {
							return (
								<MenuItem
									key={app.text}
									text={app.text}
									icon={<Icon icon={app.icon} iconSize={30} useColor={true} />}
									active={activeItem === app.text}
									onClick={() => {
										this.setState({ activeItem: app.text });
									}}
								/>
							);
						})}
					</Menu>
				</div>

				{activeItem === 'Image' && <MediaImage {...componentProps} />}
				{activeItem === 'Video' && <MediaVideo {...componentProps} />}
				{activeItem === 'Audio' && <MediaAudio {...componentProps} />}
				{activeItem === 'Other' && <MediaFile {...componentProps} />}
				{activeItem === 'Iframe' && <MediaIframe {...componentProps} />}
				{activeItem === 'YouTube' && <MediaYoutube {...componentProps} />}
				{activeItem === 'Twitter' && <MediaTwitter {...componentProps} />}
				{activeItem === 'Codepen' && <MediaCodepen {...componentProps} />}
				{activeItem === 'Vimeo' && <MediaVimeo {...componentProps} />}
				{activeItem === 'SoundCloud' && <MediaSoundcloud {...componentProps} />}
				{activeItem === 'GitHub Gist' && <MediaGithub {...componentProps} />}
			</div>
		);
	}
}
export default Media;
