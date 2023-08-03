import { AttributionWithUser, Collection, Maybe, RenderedLicense } from 'types';
import { NodeLabelMap } from 'components/Editor';
import { NoteManager } from 'client/utils/notes';
import { CitationInlineStyleKind, CitationStyleKind } from 'utils/citations';
import { Note, RenderedStructuredValues } from 'utils/notes';

export type PubMetadata = {
	title: string;
	slug: string;
	pubUrl: string;
	doi: null | string;
	publishedDateString: Maybe<string>;
	updatedDateString: Maybe<string>;
	communityTitle: string;
	accentColor: string;
	attributions: AttributionWithUser[];
	citationStyle: CitationStyleKind;
	citationInlineStyle: CitationInlineStyleKind;
	nodeLabels: NodeLabelMap;
	publisher?: string;
	primaryCollectionKind?: Collection['kind'];
	primaryCollectionTitle?: string;
	primaryCollectionMetadata?: Record<string, any>;
	license: RenderedLicense;
};

export type NotesData = {
	noteManager: NoteManager;
	citations: Note[];
	footnotes: Note[];
	renderedStructuredValues: RenderedStructuredValues;
};

export type PandocFlag = {
	name: string;
	enabled: boolean;
};
