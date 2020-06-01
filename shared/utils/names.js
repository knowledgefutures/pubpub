export const getPartsOfFullName = (fullName) => {
	const firstName = fullName
		.split(' ')
		.slice(0, -1)
		.join(' ');
	const lastName = fullName.split(' ').pop();
	const initials = firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();
	return { firstName: firstName, lastName: lastName, initials: initials };
};
