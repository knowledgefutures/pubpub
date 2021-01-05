type Point = {
	x: number;
	y: number;
};

type Rect = {
	right: number;
	left: number;
	bottom: number;
	top: number;
	x: number;
	y: number;
};

export const rectUnion = (a, b) => {
	return {
		right: Math.max(a.right, b.right),
		left: Math.min(a.left, b.left),
		x: Math.min(a.x, b.x),
		bottom: Math.max(a.bottom, b.bottom),
		top: Math.min(a.top, b.top),
		y: Math.min(a.y, b.y),
	};
};

export const rectContainsPoint = ({ left, right, top, bottom }: Rect, { x, y }: Point) => {
	return x >= left && x <= right && y >= top && y <= bottom;
};
