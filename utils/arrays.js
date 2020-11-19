export const intersperse = (arr, val) => {
	const res = [];
	arr.forEach((el, index) => {
		res.push(el);
		if (index !== arr.length - 1) {
			const resolvedVal = typeof val === 'function' ? val(index) : val;
			res.push(resolvedVal);
		}
	});
	return res;
};

export const indexByProperty = (array, property) => {
	const res = {};
	array.forEach((el) => {
		res[el[property]] = el;
	});
	return res;
};

export const unique = (array, fn) => {
	const uniqueSymbol = Symbol('unique');
	const res = [];
	const seenValues = new Set();
	array.forEach((el) => {
		const value = fn(el, uniqueSymbol);
		if (!seenValues.has(value) || value === uniqueSymbol) {
			seenValues.add(value);
			res.push(el);
		}
	});
	return res;
};

export const pruneFalsyValues = (arr) => arr.filter(Boolean);
