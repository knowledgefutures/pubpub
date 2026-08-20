import type { DocJson } from 'types';

/**
 * A pub has no abstract field. The abstract is a CONVENTION inside the pub's
 * ProseMirror doc: a level-1 heading reading "Abstract" as the document's very
 * first node, followed by one paragraph.
 *
 * This module is the single definition of that convention. It used to be
 * implemented three times, and the three disagreed:
 *
 *   - here:                              trimmed the heading text
 *   - utils/pub/metadata.js:             did not trim, and read `attrs.level`
 *                                        without a guard
 *   - workers/.../extractMetaContent.ts: additionally required the heading to be
 *                                        a single `Str` token
 *
 * So a heading of " Abstract" produced an abstract for the meta tag but not the
 * editor, and a heading whose text was split across marks (bolded, or typed with
 * an autocorrect boundary) produced one for the editor but not the JATS export.
 * Everything that needs a pub's abstract now routes through `matchAbstract`
 * below. The pandoc path operates on a different AST so it cannot share the
 * code, but it has been aligned to the same predicate.
 *
 * The single-paragraph ceiling is intentional: multi-paragraph abstracts are
 * authored with shift-enter, which inserts a `hard_break` INSIDE the one
 * paragraph rather than starting a new node.
 */

interface AbstractMatch {
	/** The abstract's paragraph node. Never includes the "Abstract" heading. */
	paragraph: NonNullable<DocJson['content']>[number];
	/** Everything after the abstract — the body proper, heading excluded. */
	rest: NonNullable<DocJson['content']>;
}

/** Concatenated text of a node's immediate text children, marks ignored. */
const textOf = (node): string =>
	(node?.content ?? [])
		.filter((child) => child?.type === 'text')
		.map((child) => child.text ?? '')
		.join('');

/**
 * Does this doc open with the abstract convention? Returns the abstract
 * paragraph and the remaining body, or null.
 */
export const matchAbstract = (doc: DocJson | null | undefined): AbstractMatch | null => {
	if (!doc?.content) return null;
	const [firstChild, secondChild, ...rest] = doc.content;
	if (!firstChild || !secondChild) return null;

	const isAbstractHeading =
		firstChild.type === 'heading' &&
		firstChild.attrs?.level === 1 &&
		textOf(firstChild).toLowerCase().trim() === 'abstract';

	if (!isAbstractHeading || secondChild.type !== 'paragraph') return null;
	return { paragraph: secondChild, rest };
};

export const getAbstractDocFromPubDoc = (doc: DocJson): null | DocJson => {
	const match = matchAbstract(doc);
	if (!match) return null;
	return { type: 'doc', attrs: {}, content: [match.paragraph] };
};

/**
 * The abstract as plain text — for `citation_abstract`, Crossref/DataCite
 * deposits, and anywhere else a string is needed. Returns '' when the pub has no
 * abstract, matching the previous getTextAbstract contract.
 *
 * `hard_break` becomes a newline. The old implementation let it fall through a
 * `default:` case and dropped it, which silently fused the last word of one
 * shift-enter paragraph onto the first word of the next.
 */
export const getAbstractText = (doc: DocJson | null | undefined): string => {
	const match = matchAbstract(doc);
	if (!match) return '';

	let text = '';
	for (const item of match.paragraph.content ?? []) {
		switch (item.type) {
			case 'text':
				text += item.text ?? '';
				for (const mark of item.marks ?? []) {
					// A link's target is not otherwise representable in plain text.
					if (mark.type === 'link' && mark.attrs?.href) {
						text += ` <${mark.attrs.href}> `;
					}
				}
				break;
			case 'hard_break':
				text += '\n';
				break;
			case 'equation':
			case 'inline_equation':
				text += item.attrs?.value ?? '';
				break;
			default:
				// Inline nodes with no textual representation (images, citations,
				// footnotes) contribute nothing.
				break;
		}
	}
	// Collapse runs of whitespace that the link handling above can introduce,
	// but keep the newlines that carry paragraph intent.
	return text
		.replace(/[^\S\n]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.trim();
};
