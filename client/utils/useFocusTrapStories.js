/* eslint-disable react/button-has-type */
import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';

import { useFocusTrap } from 'client/utils/useFocusTrap';

const FocusTrapTest = () => {
	const [clickOutside, setClickOutside] = useState(null);
	const focusTrap = useFocusTrap({
		onClickOutside: () => setClickOutside(Date.now()),
	});
	return (
		<div ref={focusTrap.ref}>
			<div>
				<button>One</button>
				<button>Two</button>
				<button>Three</button>
				<button>Four</button>
				<button>I declare a thumb war</button>
			</div>
			{clickOutside && <div>Clicked outside at: {clickOutside}</div>}
		</div>
	);
};

storiesOf('hooks/useFocusTrap', module).add('default', () => <FocusTrapTest />);
