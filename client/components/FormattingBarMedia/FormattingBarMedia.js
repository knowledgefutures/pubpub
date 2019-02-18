import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from 'components/Icon/Icon';
import { Menu, MenuItem } from '@blueprintjs/core';
import FormattingBarMediaImage from 'components/FormattingBarMedia/FormattingBarMediaImage';
import FormattingBarMediaVideo from 'components/FormattingBarMedia/FormattingBarMediaVideo';
import FormattingBarMediaAudio from 'components/FormattingBarMedia/FormattingBarMediaAudio';
import FormattingBarMediaFile from 'components/FormattingBarMedia/FormattingBarMediaFile';
import FormattingBarMediaIframe from 'components/FormattingBarMedia/FormattingBarMediaIframe';
import FormattingBarMediaYoutube from 'components/FormattingBarMedia/FormattingBarMediaYoutube';
import FormattingBarMediaCodepen from 'components/FormattingBarMedia/FormattingBarMediaCodepen';
import FormattingBarMediaVimeo from 'components/FormattingBarMedia/FormattingBarMediaVimeo';
import FormattingBarMediaSoundcloud from 'components/FormattingBarMedia/FormattingBarMediaSoundcloud';

require('./formattingBarMedia.scss');

const propTypes = {
	onInsert: PropTypes.func.isRequired,
	isSmall: PropTypes.bool.isRequired,
	editorChangeObject: PropTypes.object.isRequired,
};

class FormattingBarMedia extends Component {
	constructor(props) {
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

	render () {
		const files = [
			{ text: 'Image', icon: 'media' },
			{ text: 'Video', icon: 'video' },
			{ text: 'Audio', icon: 'volume-up' },
			{ text: 'Other', icon: 'document' },
		];
		const apps = [
			{ text: 'Iframe', icon: 'application' },
			{ text: 'YouTube', icon: 'youtube' },
			{ text: 'Codepen', icon: 'codepen' },
			{ text: 'Vimeo', icon: 'vimeo' },
			{ text: 'SoundCloud', icon: 'soundcloud' },

			// TODO: Not yet implemented
			// { text: 'Spotify', icon: 'spotify' },
			// { text: 'Twitter', icon: 'twitter' },
			// { text: 'Github', icon: 'github' },
			// { text: 'Prezi', icon: 'prezi' },
			// { text: 'LinkedIn', icon: 'linkedin' },
			// { text: 'Giphy', icon: 'giphy' },
			// { text: 'Unsplash', icon: 'unsplash' },
			// { text: 'Google Maps', icon: 'googlemaps' },
			// { text: 'Slideshare', icon: 'slideshare' },

			// { text: 'Facebook', icon: 'facebook' },
			// { text: 'Reddit', icon: 'reddit' }, /* oEmbed URL is not functioning as of 12/2018 */
		];
		const activeItem = this.state.activeItem;
		const componentProps = {
			onInsert: this.props.onInsert,
			isSmall: this.props.isSmall,
		};
		return (
			<div className="formatting-bar-media-component">
				<div className="options">
					<Menu>
						<li className="bp3-menu-header"><h6>Files</h6></li>
						{files.map((file)=> {
							return (
								<MenuItem
									key={file.text}
									text={file.text}
									icon={<Icon icon={file.icon} iconSize={30} useColor={true} />}
									active={activeItem === file.text}
									onClick={()=> {
										this.setState({ activeItem: file.text });
									}}
								/>
							);
						})}
						<li className="bp3-menu-header"><h6>Apps</h6></li>
						{apps.map((app)=> {
							return (
								<MenuItem
									key={app.text}
									text={app.text}
									icon={<Icon icon={app.icon} iconSize={30} useColor={true} />}
									active={activeItem === app.text}
									onClick={()=> {
										this.setState({ activeItem: app.text });
									}}
								/>
							);
						})}
					</Menu>
				</div>

				{activeItem === 'Image' &&
					<FormattingBarMediaImage {...componentProps} />
				}
				{activeItem === 'Video' &&
					<FormattingBarMediaVideo {...componentProps} />
				}
				{activeItem === 'Audio' &&
					<FormattingBarMediaAudio {...componentProps} />
				}
				{activeItem === 'Other' &&
					<FormattingBarMediaFile {...componentProps} />
				}
				{activeItem === 'Iframe' &&
					<FormattingBarMediaIframe {...componentProps} />
				}
				{activeItem === 'YouTube' &&
					<FormattingBarMediaYoutube {...componentProps} />
				}
				{activeItem === 'Codepen' &&
					<FormattingBarMediaCodepen {...componentProps} />
				}
				{activeItem === 'Vimeo' &&
					<FormattingBarMediaVimeo {...componentProps} />
				}
				{activeItem === 'SoundCloud' &&
					<FormattingBarMediaSoundcloud {...componentProps} />
				}
			</div>
		);
	}
}

FormattingBarMedia.propTypes = propTypes;
export default FormattingBarMedia;
