import { createReactivePlugin } from '@pubpub/prosemirror-reactive';

export default (schema, props) => {
	return createReactivePlugin({
		schema: schema,
		documentState: {
			citationManager: props.citationManager,
			blockNames: {
				image: 'Figure',
				video: 'Video',
			},
		},
	});
};
