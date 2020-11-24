const resizableImageFormats = ['jpg', 'jpeg', 'png'];
export const imageCanBeResized = (url: string) => {
	const extension = (url.split('.').pop() as string).toLowerCase();
	return resizableImageFormats.includes(extension);
};
