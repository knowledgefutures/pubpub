# Style Guide

This style guide outlines best practices for this repo. The styles captured in this guide are a bit more subjective than those caught by eslint or prettier. As such, we are not militant about enforcing these best practices - but don't be upset if someone comes and refactors your code to make it consistent with this style guide and the rest of the repo.

## React Components

```jsx
/* Use `React.Component` rather than `import React, { Component}` */
/* so that your import lines are consistent across functional and */
/* class components. */
import React from 'react';
import PropTypes from 'prop-types';
/* Keep npm_modules imports at the top */
/* Following by globally referenced repo imports */
/* Following by relative-path imports */
/* Followed by require statements */
import { helperFunc } from 'utilities';
import localFunc from './siblingFile';

require('./style.scss');

/* Keep propTypes and defaultProps outside of the component */
/* (as opposed to putting them as static variables) so that */
/* functional and class components are consistent. */
const propTypes = {
	/* Event handlers that are passed in as props */
	/* should start with 'on' */
	onThing: PropTypes.string,
};

const defaultProps = {
	onThing: 'Hello',
};

class ExampleComponent extends React.Component {
	/* Avoid static functions and vars when possible. */
	/* Opt for external functions or imported utilities. */
	constructor(props) {
		super(props);
		this.state = {
			/* When possible - start booleans with a helper prefix */
			/* For example: 'is', 'has', 'did', or 'can' */
			isLoading: false,
		};

		/* Event handler methods must be bound in the constructor and */
		/* start with the word 'handle'. Avoid using the word */
		/* 'handle' to name functions that don't require binding */
		this.handleEvent = this.handleEvent.bind(this);
	}

	componentDidMount() {
		this.doDomStuff();
	}

	handleEvent() {
		this.setState({ isLoading: true });
	}

	doDomStuff() {
		document.destroy();
	}

	render() {
		const { onThing } = this.props;
		const { isLoading } = this.state;
		return (
			<div>
				<button onClick={onThing} alt={isLoading}>
					Click me
				</button>
			</div>
		);
	}
}

ExampleComponent.propTypes = propTypes;
ExampleComponent.defaultProps = defaultProps;
/* Exporting default at the bottom is more general, */
/* because it supports cases when you need to export */
/* a wrapped version of the component. */
export default ExampleComponent;
```

## File naming

- When faced with the desire to name something `util.js`, `utils.js`, `utilities.js` or something similar permutation - pick `utils.js`.