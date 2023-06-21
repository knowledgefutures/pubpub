export const buildProxyObject = (
	resolvePromise: Promise<{
		[key: string]: any;
	}>,
) => {
	const target = {} as {
		[key: string]: any;
	} & {
		resolve: () => Promise<void>;
	};
	let hasResolved = false;
	let resolveError: null | string = null;
	let resolvedValues: Record<string, any>;

	const getBoundValue = (identifier: string) => {
		if (resolveError) {
			throw new Error(`The modelize template failed to resolve: ${resolveError}`);
		}
		if (!hasResolved) {
			throw new Error(
				"Await the modelize template's resolve() method, likely in setup(), before attempting to access models.",
			);
		}
		if (identifier in resolvedValues) {
			return resolvedValues[identifier];
		}
		throw new Error(
			`Identifier ${identifier} not bound in modelize template.` +
				` Bind it to a model by writing "Model ${identifier} { ... }"`,
		);
	};

	const toString = () => {
		const state = resolveError ? 'Error' : hasResolved ? 'Resolved' : 'Unresolved';
		return `Modelize(${state})`;
	};

	resolvePromise
		.then((values) => {
			hasResolved = true;
			resolvedValues = values;
		})
		.catch((err) => {
			resolveError = err;
		});

	return new Proxy<
		{
			[key: string]: any;
		} & {
			resolve: () => Promise<void>;
		}
	>(target, {
		get: (_, name) => {
			if (name === 'resolve') {
				return () => resolvePromise.then(() => {});
			}
			if (name === 'toString' || name === Symbol.toStringTag || typeof name === 'symbol') {
				return toString();
			}
			return getBoundValue(name);
		},
	});
};
