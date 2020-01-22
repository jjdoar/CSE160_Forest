// Jacob Baginski Doar
// jjbagins@ucsc.edu
// 11/4/2019
// utils.js

// Return the location of an attribute
function getAttributeLocation(gl, attribute) {
    var attributeLocation = gl.getAttribLocation(gl.program, attribute);
    if(attributeLocation < 0) {
        console.log("Failed to get the storage location of " + attributeLocation);
        return null;
    }
    return attributeLocation;
}

// Return the location of a uniform
function getUniformLocation(gl, uniform) {
    var uniformLocation = gl.getUniformLocation(gl.program, uniform);
    if(!uniformLocation) {
        console.log("Failed to retrieve the location of " + uniform);
        return null;
    }
    return uniformLocation;
}

// Initialize an array buffer to attribute with data
function initializeArrayBuffer(gl, attribute, data, type, num) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if(!buffer) {
        console.log("Failed to create the buffer object");
        return false;
    }

    // Write data into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // Assign the buffer object to the attribute variable
    var a_Attribute = getAttributeLocation(gl, attribute);
    if(a_Attribute == null) {
        return false;
    }
    gl.vertexAttribPointer(a_Attribute, num, type, gl.FALSE, 0, 0);

    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_Attribute);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return true;
}

// Converts cavas coordinates to world coordinates
function canvasCoordinatesToWorld(x, y, canvasWidth, canvasHeight, spanX, spanY, cameraLocationX, cameraLocationY) {
    return [
        map(x, 0, canvasWidth, -spanX, spanX) + cameraLocationX,
        map(y, 0, canvasHeight, -spanY, spanY) + cameraLocationY
    ];
}

// Return the magnitude of a 3 dimensional vector
function vec3Magnitude(x, y, z) {
    return Math.sqrt(x*x + y*y + z*z);
}

// Return a normalized version of the vector [x, y, z]
function vec3Normalize(x, y, z) {
    var mag = vec3Magnitude(x, y, z);

    return [
        x / mag,
        y / mag,
        z / mag
    ];
}

// Return v1 x v2
function vec3CrossProduct(v1X, v1Y, v1Z, v2X, v2Y, v2Z) {
    return [
        (v1Y * v2Z) - (v1Z * v2Y),
        (v1Z * v2X) - (v1X * v2Z),
        (v1X * v2Y) - (v1Y * v2X)
    ];
}

// return a number mapped from one range to another
function map(number, rangeALow, rangeAHigh, rangeBLow, rangeBHigh) {
    return (number - rangeALow) / (rangeAHigh - rangeALow) * (rangeBHigh - rangeBLow) + rangeBLow;
}
