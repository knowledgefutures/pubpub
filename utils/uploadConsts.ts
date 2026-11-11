/** Maximum file size (in bytes) allowed for user-initiated uploads. */
export const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

const inlineContentType = /^(image\/(?!svg)|video\/|audio\/|application\/pdf$)/;

/** Types a browser may open in place; everything else must be served as a download. */
export const canServeInline = (contentType: string) => inlineContentType.test(contentType);
