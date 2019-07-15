// This data is written to the response body by the server, so we only need to actually collect
// it once per page load. After that, we'll store it in this variable.
let initialData;

export const getClientInitialData = () => {
	if (!initialData) {
		initialData = JSON.parse(document.getElementById('initial-data').getAttribute('data-json'));
	}
	return initialData;
};
