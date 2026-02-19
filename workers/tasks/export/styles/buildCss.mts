import fs from 'fs';
import path from 'path';

const katexCdnPrefix = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.13.18/';

/**
 * this is run once per build to generate the export CSn
 */
export const buildExportCss = async () => {
	// @ts-expect-error shh
	const stylesDir = path.join(new URL('.', import.meta.url).pathname);
	const entrypoint = path.join(stylesDir, 'printDocument.scss');
	const cssPath = path.join(stylesDir, 'printDocument.css');

	const { renderSync } = await import('sass');
	const nodeModulesPath = path.join(process.cwd(), 'node_modules');
	const clientPath = path.join(process.cwd(), 'client');
	const entrypointContents = fs.readFileSync(entrypoint).toString();
	const data = '$PUBPUB_EXPORT: true;\n' + entrypointContents;

	const css = renderSync({
		data,
		includePaths: [nodeModulesPath, clientPath],
		importer: (url: string) => {
			if (url.startsWith('~')) {
				return { file: path.join(nodeModulesPath, url.slice(1)) };
			}
			return null;
		},
	})
		.css.toString()
		.replace(
			/url\((fonts\/KaTeX_(?:[A-z0-9\-_]*?).(?:[A-z0-9]+))\)/g,
			(_: string, fontPath: string) => `url(${katexCdnPrefix + fontPath})`,
		);

	fs.writeFileSync(cssPath, css);
	console.log(`Built export CSS: ${cssPath}`);
	return cssPath;
};

// @ts-expect-error shh
if (import.meta.main) {
	buildExportCss();
}
