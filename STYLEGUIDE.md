# Style Guide

This style guide outlines best practices for this repo. The styles captured in this guide are a bit more subjective than those caught by eslint or prettier. As such, we are not militant about enforcing these best practices - but don't be upset if someone comes and refactors your code to make it consistent with this style guide and the rest of the repo.

## React Components

```jsx
/* Keep npm_modules imports at the top */
/* Following by globally referenced repo imports */
/* Following by relative-path imports */
/* Followed by require statements */
/* Separate each by a blank line */
import React from 'react';
import PropTypes from 'prop-types';

import { PageContext } from 'utils/hooks';
import { hydrateWrapper } from 'client/utils/hydrateWrapper';

import localFunc from './siblingFile';
import getThing from './thing';

require('./style.scss');

/* Keep propTypes and defaultProps above the component declaration */
const propTypes = {
	/* Event handlers that are passed in as props */
	/* should start with 'on' */
	onThing: PropTypes.func,
};

const defaultProps = {
	onThing: () => {},
};

/* Use functional React components whenever possible. */
const ExampleBlock = (props) => {
	/* Destructure props before other declarations */
	const { onThing } = props;
	
	/* Set the className of the outermost element to the hyphen-separated */
	/* name of the react component with a `-component` or `-container` suffix */
	return (
		<div className="example-block-component">
			<button onClick={onThing} alt={isLoading}>
				Click me
			</button>
		</div>
	);
};

ExampleBlock.propTypes = propTypes;
ExampleBlock.defaultProps = defaultProps;
/* Exporting default at the bottom, as opposed to inline with the declaration */
/* is more generally consistent, because it supports cases when you need to */
/* export a wrapped version of the component. */
export default ExampleBlock;
```

## Utility files
This repo uses three main utilities folders:
```
/utils: Shared util files
/client/utils: Client specific util files (e.g. dependent on window or DOM)
/server/utils: Server specific util files (e.g. dependent on server-side permissions or packages)
```

There can be a bit of craft in deciding where a certain utility file goes, so it's nice to be clear about the tradeoffs:
- **`/utils`**: These are expected to be called on both the server and client. They are likely to be bundled and sent to the client, so file size should be a consideration.
- **`/client/utils`**: These are expected to only be called on the client. They *can* be called from the server, but doing so may be bad practice. If your function uses `apiFetch()`, `window` or `document` it likely belongs here.
- **`/server/utils`**: These are expected to only be called on the server. They should not be bundled and sent to the client (they may rely on config var values) - and as such *must* not be called by the client.

Do not use `utils/index.js` files. Separate utils files and be specific in calling them. This can help prevent cyclic dependencies and makes navigating to the right file simpler. For example:

```
import { buildUrl } from 'utils/urls';
import { usePageContext } from 'utils/hooks';
```


## Imports
Relative paths should only be used in imports for neighbor or child files. That is, never use `../` in an import or require statement. The webpack configs in `client/webpack` and `.storybook` as well as `.eslintrc` have been configured with a set of aliases to allow parent resolutions. 

If you are finding yourself consistently wanting to import a parent file, you can either reconsider the structure of the code you're working on or create an additional alias in the webpack and eslint configs.


## Storybook
Storybook will iterate over all files, grabbing any that end in `Stories.js`. Place storybook files alongside the component file they are testing and name them as `${camelCased component name}Stories.js`. This makes it much simpler to see whether a certain component has a corresponding stories file and keeps it closer to mind when changes are made to the component.

```
SimpleEditor/
	SimpleEditor.js
	simpleEditorStories.js
	editorFuncs.js
```



