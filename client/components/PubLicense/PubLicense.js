import React from 'react';

require('./pubLicense.scss');

const PubLicense = function() {
	return (
		<div className="pub-license-component">
			<a rel="license" href="https://creativecommons.org/licenses/by/4.0/">
				<img
					alt="Creative Commons License"
					src="https://licensebuttons.net/l/by/4.0/88x31.png"
				/>
			</a>
			<div className="text">
				This work is licensed under a{' '}
				<a rel="license" href="https://creativecommons.org/licenses/by/4.0/">
					Creative Commons Attribution 4.0 International License
				</a>
				.
			</div>
		</div>
	);
};

export default PubLicense;
