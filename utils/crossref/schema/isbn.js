/**
 * Renders an isbn, or a noisbn if we don't have one.
 */

export default (isbn, noIsbnReason = 'monograph') => {
	if (isbn) {
		return { isbn };
	}
	return { noisbn: { '@reason': noIsbnReason } };
};
