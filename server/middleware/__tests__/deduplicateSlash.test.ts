import { deduplicateSlash } from '../deduplicateSlash';

describe('deduplicate Slash Middleware', () => {
	let mockRes;
	let mockReq;
	let nextFn;
	const dedupeMiddleware = deduplicateSlash();

	beforeEach(() => {
		mockRes = {
			redirect: jest.fn(),
		};
		mockReq = {
			url: '',
		};
		nextFn = jest.fn();
	});

	it('redirects to a url with slashes deduplicated', async () => {
		mockReq.url = '//someotherhost.com';
		dedupeMiddleware(mockReq, mockRes, nextFn);
		expect(mockRes.redirect).toBeCalledWith(301, '/someotherhost.com');
	});
	it('does not redirect if no duplicate slashes are found', async () => {
		mockReq.url = '/a/normal/pubpub/route';
		dedupeMiddleware(mockReq, mockRes, nextFn);
		expect(mockRes.redirect).not.toBeCalled();
		expect(nextFn).toBeCalledTimes(1);
	});
	it('does not redirect if duplicate slashes are found only in the query string', async () => {
		mockReq.url =
			'/api/editor/embed?type=youtube&input=https://www.youtube.com/watch?v=PL9iMPx9CpQ';
		dedupeMiddleware(mockReq, mockRes, nextFn);
		expect(mockRes.redirect).not.toBeCalled();
		expect(nextFn).toBeCalledTimes(1);
	});
});
