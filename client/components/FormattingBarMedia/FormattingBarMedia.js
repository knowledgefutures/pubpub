import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from 'components/Icon/Icon';
import { Button, Menu, MenuItem } from '@blueprintjs/core';

require('./formattingBarMedia.scss');

const propTypes = {
	
};

const defaultProps = {
	
};

class FormattingBarMedia extends Component {
	constructor(props) {
		super(props);
		this.state = {
			
		};
	}

	render () {
		const files = [
			{ text: 'Image', icon: 'media' },
			{ text: 'Video', icon: 'video' },
			{ text: 'Audio', icon: 'volume-up' },
			{ text: 'File', icon: 'document' },
		];
		const apps = [
			{ text: 'Twitter', icon: 'twitter' },
			{ text: 'Github', icon: 'github' },
			{ text: 'Prezi', icon: 'prezi' },
			{ text: 'LinkedIn', icon: 'linkedin' },
			{ text: 'Reddit', icon: 'reddit' },
			{ text: 'Facebook', icon: 'facebook' },
			{ text: 'Giphy', icon: 'giphy' },
			{ text: 'Youtube', icon: 'youtube' },
			{ text: 'Vimeo', icon: 'vimeo' },
			{ text: 'Soundcloud', icon: 'soundcloud' },
			{ text: 'Spotify', icon: 'spotify' },
			{ text: 'Codepen', icon: 'codepen' },
			{ text: 'Unsplash', icon: 'unsplash' },
			{ text: 'Google Maps', icon: 'googlemaps' },
			{ text: 'Slideshare', icon: 'slideshare' },
		];
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
								/>
							);
						})}
					</Menu>
				</div>
				<div className="content">

				</div>
			</div>
		);
	}
}

FormattingBarMedia.propTypes = propTypes;
FormattingBarMedia.defaultProps = defaultProps;
export default FormattingBarMedia;
