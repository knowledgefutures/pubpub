import path from 'path';
import fs from 'fs';
import YAML from 'yaml';
import { FileResult } from 'tmp-promise';
import { spawnSync } from 'child_process';
import { fromProsemirror, emitPandocJson } from '@pubpub/prosemirror-pandoc';
import dateFormat from 'dateformat';

import { DocJson } from 'types';
import { editorSchema, getReactedDocFromJson } from 'components/Editor';
import { getPathToCslFileForCitationStyleKind } from 'server/utils/citations';
import { PandocTarget } from 'utils/export/formats';

import { rules } from '../import/rules';
import { getAffiliations, getDedupedAffliations, getTmpFileForExtension } from './util';
import { NotesData, PubMetadata, PandocFlag } from './types';
import { runTransforms } from './transforms';
import {
	getPandocNotesById,
	PandocNotes,
	modifyJatsContentToIncludeUnstructuredNotes,
} from './notes';

const formatToTemplateExtension = {
	epub: 'epub3',
};

const getTemplatePath = (pandocTarget: string) => {
	const targetExtension = formatToTemplateExtension[pandocTarget] || pandocTarget;
	return path.join(__dirname, 'templates', `default.${targetExtension}`);
};

const createPandocArgs = (
	pandocTarget: PandocTarget,
	pandocFlags: PandocFlag[],
	tmpFilePath: string,
	metadataFilePath?: string,
	bibliographyFilePath?: string,
) => {
	// pandoc inexplicably does not include a default template for docx or odt
	const template = pandocTarget !== 'docx' && pandocTarget !== 'odt' && pandocTarget !== 'json';
	const targetPlusFlags =
		pandocTarget + pandocFlags.map((f) => `${f.enabled ? '+' : '-'}${f.name}`).join('');
	return [
		['-f', 'json'],
		['-t', targetPlusFlags],
		['-o', tmpFilePath],
		template && [`--template=${getTemplatePath(pandocTarget)}`],
		metadataFilePath && [`--metadata-file=${metadataFilePath}`],
		bibliographyFilePath && [`--bibliography=${bibliographyFilePath}`],
		['--citeproc'],
	]
		.filter((x): x is string[] => !!x)
		.reduce((acc, next) => [...acc, ...next], []);
};

const createCslJsonBibliographyFile = async (notes: PandocNotes) => {
	const cslJson = Object.values(notes).map((note) => note.cslJson);
	const file = await getTmpFileForExtension('json');
	fs.writeFileSync(file.path, JSON.stringify(cslJson));
	return file.path;
};

const createYamlMetadataFile = async (pubMetadata: PubMetadata, pandocTarget: PandocTarget) => {
	const {
		title,
		slug,
		attributions,
		publishedDateString,
		primaryCollectionMetadata,
		communityTitle,
		publisher,
		doi,
		citationStyle,
		license,
		pubUrl,
	} = pubMetadata;
	const cslFile = getPathToCslFileForCitationStyleKind(citationStyle);
	const dedupedAffiliations = getDedupedAffliations(attributions);
	const formattedAffiliations = dedupedAffiliations.map((aff, affIndex) => {
		return { id: affIndex, organization: aff };
	});
	const formattedAttributions = attributions.map((attr) => {
		if (pandocTarget === 'jats_archiving') {
			const publicEmail = 'publicEmail' in attr.user ? attr.user.publicEmail : null;
			const affiliationIds = getAffiliations(attr).map((aff) => {
				return dedupedAffiliations.indexOf(aff);
			});
			return {
				...(attr.user.lastName && { surname: attr.user.lastName }),
				...(attr.user.firstName && { 'given-names': attr.user.firstName }),
				...(publicEmail && { email: publicEmail }),
				...(attr.user.orcid && { orcid: attr.user.orcid }),
				...(attr.affiliation && { affiliation: affiliationIds }),
			};
		}
		return attr.user.fullName;
	});
	const metadata = YAML.stringify({
		title,
		author: formattedAttributions,
		...(publishedDateString && {
			date: {
				day: dateFormat(publishedDateString, 'dd'),
				month: dateFormat(publishedDateString, 'mm'),
				year: dateFormat(publishedDateString, 'yyyy'),
			},
		}),
		journal: {
			title: communityTitle,
			...(primaryCollectionMetadata && {
				...(primaryCollectionMetadata.printIssn && {
					pissn: primaryCollectionMetadata.printIssn,
				}),
				...(primaryCollectionMetadata.electronicIssn && {
					eissn: primaryCollectionMetadata.electronicIssn,
				}),
			}),
			'publisher-name': publisher || communityTitle,
		},
		copyright: {
			text: license.full,
			type: license.short,
			...(license.link && { link: license.link }),
		},
		affiliation: formattedAffiliations,
		uri: pubUrl,
		...(primaryCollectionMetadata && {
			article: {
				...(primaryCollectionMetadata.issue && { issue: primaryCollectionMetadata.issue }),
				...(primaryCollectionMetadata.volume && {
					volume: primaryCollectionMetadata.volume,
				}),
				...(doi && { doi }),
				'elocation-id': slug,
			},
		}),
		'link-citations': true, // See https://github.com/jgm/pandoc/issues/6013#issuecomment-921409135
		...(cslFile && { csl: cslFile }),
	});
	const file = await getTmpFileForExtension('yaml');
	fs.writeFileSync(file.path, metadata);
	return file.path;
};

const createResources = (pandocNotes: PandocNotes) => {
	return {
		note: (id: string) => {
			return pandocNotes[id];
		},
	};
};

const getPandocFlags = (options: ExportWithPandocOptions): PandocFlag[] => {
	const { pandocTarget } = options;
	if (pandocTarget === 'jats_archiving') {
		return [{ name: 'element_citations', enabled: true }];
	}
	return [];
};

const reactPubDoc = (options: ExportWithPandocOptions) => {
	const { pubDoc, pubMetadata, notesData } = options;
	return getReactedDocFromJson(
		pubDoc,
		editorSchema,
		notesData.noteManager,
		pubMetadata.nodeLabels,
	);
};

const callPandoc = (pandocJson: object, args: string[]) => {
	const proc = spawnSync('pandoc', args, {
		input: JSON.stringify(pandocJson),
		maxBuffer: 1024 * 1024 * 25,
	});
	return { error: proc.stderr.toString(), success: proc.status === 0 };
};

type ExportWithPandocOptions = {
	pubDoc: DocJson;
	pandocTarget: PandocTarget;
	pubMetadata: PubMetadata;
	tmpFile: FileResult;
	notesData: NotesData;
};

export const exportWithPandoc = async (options: ExportWithPandocOptions) => {
	const { pandocTarget, pubMetadata, tmpFile, notesData } = options;
	const pandocNotes = getPandocNotesById(notesData);
	const pubDoc = reactPubDoc(options);
	const metadataFile = await createYamlMetadataFile(pubMetadata, pandocTarget);
	const bibliographyFile = await createCslJsonBibliographyFile(pandocNotes);
	const pandocFlags = getPandocFlags(options);
	const pandocArgs = createPandocArgs(
		pandocTarget,
		pandocFlags,
		tmpFile.path,
		metadataFile,
		bibliographyFile,
	);
	const preTransformedPandocAst = fromProsemirror(pubDoc, rules, {
		prosemirrorDocWidth: 675,
		resources: createResources(pandocNotes),
	}).asNode();
	const pandocAst = runTransforms(preTransformedPandocAst);
	const pandocJson = emitPandocJson(pandocAst);
	const { error, success } = callPandoc(pandocJson, pandocArgs);
	if (!success) {
		throw new Error(error);
	}
	// At this point, pandoc has written the document to our temp file. Here
	// we do some additional post-processing.
	if (pandocTarget === 'jats_archiving') {
		const pandocOutput = fs.readFileSync(tmpFile.path).toString();
		const transformedOutput = modifyJatsContentToIncludeUnstructuredNotes(
			pandocOutput,
			pandocNotes,
		);
		fs.writeFileSync(tmpFile.path, transformedOutput);
	}
};
