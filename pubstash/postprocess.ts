/**
 * PDF post-processing: metadata, outlines (bookmarks), and page boxes.
 *
 * Ported from the pubpub/pagedjs-cli fork's PostProcesser, rewritten for
 * modern pdf-lib (^1.17). The original used pdf-lib 0.6.4 with a custom
 * PDFDocumentWriter — none of that is needed with the current API.
 */
import {
	PDFArray,
	PDFDict,
	PDFDocument,
	PDFName,
	PDFNumber,
	type PDFRef,
	PDFString,
} from 'pdf-lib';

// ---------------------------------------------------------------------------
// Types for data extracted from the browser page
// ---------------------------------------------------------------------------

export interface PdfMeta {
	title?: string;
	author?: string;
	subject?: string;
	keywords?: string;
	creator?: string;
	producer?: string;
}

export interface PageBoxes {
	media: { width: number; height: number; x: number; y: number };
	crop: { width: number; height: number; x: number; y: number };
}

export interface OutlineNode {
	title: string;
	id: string;
	children: OutlineNode[];
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function postProcessPdf(
	pdfBytes: Buffer | Uint8Array,
	options: {
		meta?: PdfMeta;
		pages?: PageBoxes[];
		outline?: OutlineNode[];
	},
): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.load(pdfBytes, { updateMetadata: false });

	if (options.meta) {
		applyMetadata(pdfDoc, options.meta);
	}

	if (options.pages?.length) {
		applyPageBoxes(pdfDoc, options.pages);
	}

	if (options.outline?.length) {
		addOutline(pdfDoc, options.outline);
	}

	return pdfDoc.save();
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

function applyMetadata(pdfDoc: PDFDocument, meta: PdfMeta) {
	if (meta.title) pdfDoc.setTitle(meta.title);
	if (meta.author) pdfDoc.setAuthor(meta.author);
	if (meta.subject) pdfDoc.setSubject(meta.subject);
	if (meta.keywords) pdfDoc.setKeywords([meta.keywords]);
	if (meta.creator) pdfDoc.setCreator(meta.creator);
	if (meta.producer) pdfDoc.setProducer(meta.producer);

	pdfDoc.setCreationDate(new Date());
	pdfDoc.setModificationDate(new Date());
}

// ---------------------------------------------------------------------------
// Page boxes (TrimBox / CropBox for bleed handling)
// ---------------------------------------------------------------------------

function applyPageBoxes(pdfDoc: PDFDocument, pages: PageBoxes[]) {
	const pdfPages = pdfDoc.getPages();

	pdfPages.forEach((pdfPage, index) => {
		const pageInfo = pages[index];
		if (!pageInfo) return;

		const { media, crop } = pageInfo;

		// If media and crop are identical, no bleed — nothing to do
		if (
			media.width === crop.width &&
			media.height === crop.height &&
			media.x === crop.x &&
			media.y === crop.y
		) {
			return;
		}

		const rectangle = PDFArray.withContext(pdfDoc.context);
		rectangle.push(PDFNumber.of(crop.x));
		rectangle.push(PDFNumber.of(crop.y));
		rectangle.push(PDFNumber.of(crop.width + crop.x));
		rectangle.push(PDFNumber.of(crop.height + crop.y));

		pdfPage.node.set(PDFName.of('TrimBox'), rectangle);
		pdfPage.node.set(PDFName.of('CropBox'), rectangle);
	});
}

// ---------------------------------------------------------------------------
// PDF Outlines / Bookmarks
//
// Modern pdf-lib doesn't have a high-level outline API, so we build the
// outline tree from PDFDicts manually — matching what the old PostProcesser
// did with pdf-lib 0.6.4, just with the current object model.
// ---------------------------------------------------------------------------

interface OutlineItemRefs {
	node: OutlineNode;
	ref: PDFRef;
	children: OutlineItemRefs[];
}

function addOutline(pdfDoc: PDFDocument, outline: OutlineNode[]) {
	if (!outline.length) return;

	const context = pdfDoc.context;
	const _pages = pdfDoc.getPages();

	// Build a map from element id → page index + PDFRef for named destinations
	// (We'll create /Dest as a named destination string which Chromium's page.pdf
	// should have already embedded as anchors. If not, we fall back to page-level.)

	// Allocate refs for all outline items
	function allocRefs(nodes: OutlineNode[]): OutlineItemRefs[] {
		return nodes.map((node) => ({
			node,
			ref: context.nextRef(),
			children: allocRefs(node.children),
		}));
	}

	const tree = allocRefs(outline);

	// Count total items in a subtree
	function countItems(items: OutlineItemRefs[]): number {
		let count = 0;
		for (const item of items) {
			count += 1;
			count += countItems(item.children);
		}
		return count;
	}

	// Create outline item dicts
	function createItems(items: OutlineItemRefs[], parent: PDFRef) {
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const prev = i > 0 ? items[i - 1].ref : undefined;
			const next = i < items.length - 1 ? items[i + 1].ref : undefined;

			const dict = context.obj({
				Title: PDFString.of(item.node.title),
				Parent: parent,
				// Use a named destination (anchor id) — PDF viewers that support
				// this will jump to the right spot on the page
				Dest: PDFName.of(item.node.id),
			});

			if (prev) dict.set(PDFName.of('Prev'), prev);
			if (next) dict.set(PDFName.of('Next'), next);

			if (item.children.length > 0) {
				dict.set(PDFName.of('First'), item.children[0].ref);
				dict.set(PDFName.of('Last'), item.children[item.children.length - 1].ref);
				dict.set(PDFName.of('Count'), PDFNumber.of(countItems(item.children)));
				createItems(item.children, item.ref);
			}

			context.assign(item.ref, dict);
		}
	}

	// Create the root /Outlines dict
	const outlinesRef = context.nextRef();
	const outlinesDict = context.obj({
		Type: 'Outlines',
		First: tree[0].ref,
		Last: tree[tree.length - 1].ref,
		Count: PDFNumber.of(countItems(tree)),
	});
	context.assign(outlinesRef, outlinesDict);

	createItems(tree, outlinesRef);

	// Attach to the document catalog
	pdfDoc.catalog.set(PDFName.of('Outlines'), outlinesRef);
}
