import React from 'react';
import { Classes } from '@blueprintjs/core';

require('./landing.scss');

const Landing = () => {
	return (
		<div id="landing-container">
			<style>{`
				.header-component.${Classes.DARK} a.${Classes.BUTTON},
				.header-component.${Classes.DARK} a.${Classes.BUTTON}:hover {
					color: #111;
				}
			`}</style>
			{/* BEGIN Jumbotron */}
			<div id="jumbotron">
				{/* BEGIN Jumbotron Content */}
				<div className="container">
					<div className="row content">
						<div className="col-4">
							<h1>PubPub Legacy</h1>
							<p className="subtitle">
								PubPub is evolving. Read our announcement to learn about the new
								PubPub Platform for creating full-stack knowledge infrastructure and
								our plans for helping PubPub Legacy users transition by May 2025.
							</p>
							<div className="buttons">
								<a
									href="https://www.knowledgefutures.org/updates/pubpub-platform/"
									className="custom-button black"
								>
									Learn More
								</a>
							</div>
							<div className="buttons">
								<a
									href="https://knowledgefutures.org/contact/"
									className="custom-button"
								>
									Get In Touch
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/* END Jumbotron */}
			{/* END Main content */}
		</div>
	);
};

export default Landing;
