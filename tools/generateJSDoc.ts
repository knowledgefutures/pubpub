import { execSync } from 'child_process';
import { argv } from 'process';
import { type ObjectLiteralExpression, Project, SyntaxKind, ts } from 'ts-morph';

const ifLine = (arg: string | undefined | boolean, templ = arg, noNewline = false) =>
	arg ? ` * ${templ}${noNewline ? '' : '\n *'}` : '';

const getText = (initializer: ObjectLiteralExpression | undefined, prop: string) => {
	const thing = initializer?.getProperty(prop)?.getChildAtIndex(2);

	if (
		!thing?.isKind(SyntaxKind.NoSubstitutionTemplateLiteral) &&
		!thing?.isKind(SyntaxKind.StringLiteral)
	) {
		return '';
	}

	return thing.compilerNode.text?.replace(/\t/g, '').replace(/\n/g, '\n * ');
};

function template(initializer: ObjectLiteralExpression) {
	const [, description, path, method] = ['summary', 'description', 'path', 'method'].map((prop) =>
		getText(initializer, prop),
	);

	const metadataRaw = initializer
		.getProperty('metadata')
		?.getChildAtIndex(2)
		?.getChildrenOfKind(SyntaxKind.ObjectLiteralExpression);

	const metadata = metadataRaw?.[0];

	const [loggedIn, example, since] = ['loggedIn', 'example', 'since'].map((prop) =>
		getText(metadata, prop),
	);

	const result = [
		`/**`,
		` * \`${method} ${path}\``,
		` *`,
		ifLine(description),
		ifLine(example, `@example\n * ${example}`),
		ifLine(since),
		ifLine(
			loggedIn !== 'false',
			`@access ${
				loggedIn === 'admin'
					? 'You need to be an **admin** of this community in order to access this resource.'
					: 'You need to be **logged in** and have access to this resource.'
			}`,
		),
		` * @routeDocumentation
* {@link https://pubpub.org/apiDocs#/paths/${path
			?.replace(/^\//, '')
			.replace(/\//g, '-')
			.replace(/:(\w+)-/g, '$1-')
			.replace(/:(\w+)/g, '$1')}/${method?.toLowerCase()}}`,
		' */',
	]
		.filter(Boolean)
		.join('\n');

	return result;
}

function updateJSDocComments(dir: string) {
	const project = new Project({
		tsConfigFilePath: 'tsconfig.json',
	});

	const sourceFiles = project.getSourceFiles(`${dir.replace(/\/$/, '')}/*.ts`);

	sourceFiles.forEach((sourceFile) => {
		const paths: string[] = [];

		sourceFile.forEachDescendant((node) => {
			if (!ts.isObjectLiteralExpression(node.compilerNode)) {
				return;
			}
			const objL = node.asKind(SyntaxKind.ObjectLiteralExpression)!;

			const properties = objL.getProperties();

			properties.forEach((prop) => {
				if (prop.getKind() !== SyntaxKind.PropertyAssignment) {
					return;
				}
				const propertyAssignment = prop.asKind(SyntaxKind.PropertyAssignment)!;
				const initializer = propertyAssignment.getInitializerIfKind(
					SyntaxKind.ObjectLiteralExpression,
				)!;
				const name = propertyAssignment.getName();
				if (paths.includes(name)) {
					return;
				}

				if (!initializer || !initializer.getProperty('path')) {
					return;
				}
				const newJsDocComment = template(initializer);

				const ogText = propertyAssignment.getText();
				// Determine position for inserting the new JSDoc comment

				propertyAssignment.replaceWithText(`${newJsDocComment}\n${ogText}`);
			});
		});
		sourceFile.saveSync();
	});

	execSync(`npx prettier ${dir} -w`);
}

// Usage Example
updateJSDocComments(argv[2]);
