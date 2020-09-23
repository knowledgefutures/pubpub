import { createReactivePlugin } from '@pubpub/prosemirror-reactive';

export default (schema, props) => {
	return createReactivePlugin({
		schema: schema,
		documentState: {
			blockNames: props.blockNames,
			citationManager: props.citationManager,
		},
	});
};
