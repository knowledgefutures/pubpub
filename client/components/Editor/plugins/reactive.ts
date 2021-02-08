import { createReactivePlugin } from '@pubpub/prosemirror-reactive';

export default (schema, props) => {
	return createReactivePlugin({
		schema,
		documentState: {
			nodeLabels: props.nodeLabels,
			citationManager: props.citationManager,
		},
	});
};
