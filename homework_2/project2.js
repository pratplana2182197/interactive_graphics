// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.

//matrix column-major order
// array = [0, 1, 2, 3, 4, 5, 6, 7, 8]
//matrix = [0 3 6
//          1 4 7
//          2 5 8]


function GetTransform(positionX, positionY, rotation, scale) {
	rotation = rotation * Math.PI / 180;

	// Scale matrix (column-major) "transposed"
	const s = [
		scale, 0,     0,
		0,     scale, 0,
		0,     0,     1
	];

	// Rotation matrix - "transposed"
	const cos = Math.cos(rotation);
	const sin = Math.sin(rotation);
	const r = [
		cos, sin, 0,
		-sin,  cos, 0,
		0,     0,  1
	];

	// Translation matrix - "transposed"
	const t = [
		1, 0, 0,
		0, 1, 0,
		positionX, positionY, 1
	];

	let trans = multiplyFlatMatrices3x3(r, s);  // scale then rotate
	trans = multiplyFlatMatrices3x3(t, trans);  // then translate

	return trans;
}


// // Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// // The arguments are transformation matrices in the same format.
// // The returned transformation first applies trans1 and then trans2.

function multiplyFlatMatrices3x3(a, b) {
	if (a.length !== 9 || b.length !== 9) {
		throw new Error("Both matrices must be flat 9-element arrays.");
	}

	const result = new Array(9).fill(0);

	for (let row = 0; row < 3; row++) {
		for (let col = 0; col < 3; col++) {
			for (let k = 0; k < 3; k++) {
				result[col * 3 + row] += a[k * 3 + row] * b[col * 3 + k];
			}
		}
	}

	return result;
}

function ApplyTransform(trans1, trans2) {
	return multiplyFlatMatrices3x3(trans2, trans1);
}
