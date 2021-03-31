const resizableImageFormats = ['jpg', 'jpeg', 'png'];

export const isResizeableFormat = (url: string) => {
	const extension = (url.split('.').pop() as string).toLowerCase();
	return resizableImageFormats.includes(extension);
};
