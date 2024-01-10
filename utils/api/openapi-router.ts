import { Request, Response, Router } from 'express';
import { generateOpenApi } from '@ts-rest/open-api';
import { InfoObject, OpenAPIObject } from 'openapi3-ts/oas31';
import { contract } from './contract';

type OpenAPIOptions = Omit<OpenAPIObject, 'paths' | 'openapi'> & {
	info: InfoObject;
	jsonEndpointUrl?: string;
};

const openApiMiddlewareOptionsDefaults: Partial<OpenAPIOptions> = {
	jsonEndpointUrl: '/spec.json',
};

// this is a neat trick that allow prettier to format the html string
const html = String.raw;

export const openApiMiddleware = (options: OpenAPIOptions) => {
	const optionsWithDefaults = {
		...openApiMiddlewareOptionsDefaults,
		...options,
	};

	const router = Router();

	let openApiDoc: ReturnType<typeof generateOpenApi>;

	const openApiJsonPath = optionsWithDefaults.jsonEndpointUrl as string;
	router.get(openApiJsonPath, (req, res) => {
		openApiDoc = openApiDoc || generateOpenApi(contract, optionsWithDefaults);
		res.json(openApiDoc);
	});

	router.get('/', (req: Request, res: Response) => {
		const path = req.baseUrl + req.path;
		res.type('.html');
		res.send(
			html`<!doctype html>
				<html lang="en">
					<head>
						<meta charset="utf-8" />
						<meta
							name="viewport"
							content="width=device-width, initial-scale=1, shrink-to-fit=no"
						/>
						<title>Elements in HTML</title>

						<script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
						<link
							rel="stylesheet"
							href="https://unpkg.com/@stoplight/elements/styles.min.css"
						/>
					</head>
					<body>
						<style>
							.sl-elements.sl-antialiased.sl-h-full.sl-text-base.sl-font-ui.sl-text-body {
								height: 100vh !important;
							}
						</style>

						<elements-api
							apiDescriptionUrl="${path}${openApiJsonPath}"
							router="hash"
							tryItCredentialsPolicy="same-origin"
						/>
					</body>
				</html>`,
		);
	});

	return router;
};
