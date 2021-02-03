// Cribbed from https://gitlab.com/emergence-engineering/prosemirror-image-plugin/-/blob/master/src/utils.ts
export const dataUriToFile = (uri: string) => {
	if (uri.startsWith('data:')) {
		return null;
	}
	const arr = uri.split(',');
	const mime = arr[0]?.match(/:(.*?);/)?.[1];
	const bstr = atob(arr[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new File([u8arr], Date.now().toString(), { type: mime });
};
