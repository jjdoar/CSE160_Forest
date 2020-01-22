// Jacob Baginski Doar
// jjbagins@ucsc.edu
// 11/4/2019
// Tree.js

var Tree = function(level, color, glossiness) {
    this.level = level;
    this.color = color;
    this.glossiness = glossiness;

    this.vertices = [];
    this.surfaceNormals = [];
    this.vertexNormals = [];

    this.scale = 1.0;
    this.translation = [0.0, 0.0, 0.0];
    this.rotation = [0.0, 0.0, 0.0];

    this.lightOn = 0;

    if(this.createTree(level) == -1) {
        console.log("Error: Failed to create tree");
    }

    this.numVertices = this.vertices.length / 3;
}

// Create a tree by populating the vertices,
// surface normals, and vertex normals arrays
Tree.prototype.createTree = function(level) {
    // Get tree vertices
    switch(level) {
        case 0:
            var v = treeR0;
            break;
        case 1:
            var v = treeR1;
            break;
        case 2:
            var v = treeR2;
            break;
        case 3:
            var v = treeR3;
            break;
        case 4:
            var v = treeR4;
            break;
        case 5:
            var v = treeR5;
            break;
        case 6:
            var v = treeR6;
            break;
        default:
            console.log("Error: Unable to create tree due to invalid level: ", level, ". Level must be in range (0, 6)");
            return -1;
    }
    for(var i = 0; i < v.length; i+=6) {
        var d = Math.sqrt((v[i]-v[i+3])*(v[i]-v[i+3])+(v[i+1]-v[i+4])*(v[i+1]-v[i+4])+(v[i+2]-v[i+5])*(v[i+2]-v[i+5]));
        this.createCylinder(v[i], v[i+1], v[i+2], v[i+3], v[i+4], v[i+5], d);
    }
}

Tree.prototype.createCylinder = function(x1, y1, z1, x2, y2, z2, d) {
    r1 = d/10;
	r2 = d/20;
	sides = 12;
	var vertices = [];
	var Circle1 = [];
	var Circle2 = [];
	var surfaceNormals = [];
    var vertexNormals = [];

    // Push circle locations
    for (var i = 0; i <= sides; i++) {
        var angle = (i * 2 * Math.PI / sides);
		Circle1.push(r1 * Math.cos(angle), r1 * Math.sin(angle));
        Circle2.push(r2 * Math.cos(angle), r2 * Math.sin(angle));
    }

    // Push to vertex array
	for (var i = 0; i < (sides*2); i=i+2) {
        vertices.push(
            x2+Circle2[i], y2+Circle2[i+1], z2,
		    x1+Circle1[i], y1+Circle1[i+1], z1,
		    x2+Circle2[i+2], y2+Circle2[i+3], z2,
		    x2+Circle2[i+2], y2+Circle2[i+3], z2,
		    x1+Circle1[i], y1+Circle1[i+1], z1,
		    x1+Circle1[i+2], y1+Circle1[i+3], z1
        );
    }

    // Calculate and push surfaceNormals
    for (var i = 0; i < vertices.length; i+=9) {
        // Create Vectors
		var v1 = [vertices[i], vertices[i+1], vertices[i+2]];
        var v2 = [vertices[i+3], vertices[i+4], vertices[i+5]];
        var v3 = [vertices[i+6], vertices[i+7], vertices[i+8]];
        var v21 = [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
        var v23 = [v3[0] - v2[0], v3[1] - v2[1], v3[2] - v2[2]];

		// Calculate surfaceNormals
		var N = [];
		var N1 = v23[1]*v21[2] - v23[2]*v21[1];
		var N2 = v21[0]*v23[2] - v21[2]*v23[0];
		var N3 = v23[0]*v21[1] - v23[1]*v21[0];

        N.push(N1, N2 ,N3);
        N = vec3Normalize(N[0], N[1], N[2]);

        surfaceNormals = surfaceNormals.concat(N, N, N);
    }

    // Calculate and push vertexNormals
    for(var i = 0; i < sides; i++) {
        var index1 = i * 18;
        var index2 = (i - 1 < 0) ? (sides - 1) * 18 : (i - 1) * 18;
        var index3 = ((i + 1) % sides) * 18;
        var N1 = [surfaceNormals[index1 + 0] + surfaceNormals[index2 + 9], surfaceNormals[index1 + 1] + surfaceNormals[index2 + 10], surfaceNormals[index1 + 2] + surfaceNormals[index2 + 11]];
        var N2 = [surfaceNormals[index1 + 6] + surfaceNormals[index3 + 0], surfaceNormals[index1 + 7] + surfaceNormals[index3 + 1], surfaceNormals[index1 + 8] + surfaceNormals[index3 + 2]];

        N1 = vec3Normalize(N1[0], N1[2], N1[2]);
        N2 = vec3Normalize(N2[0], N1[1], N1[2]);

        vertexNormals = vertexNormals.concat(N1, N1, N2, N2, N1, N2);
    }

    this.vertices = this.vertices.concat(vertices);
    this.surfaceNormals = this.surfaceNormals.concat(surfaceNormals);
    this.vertexNormals = this.vertexNormals.concat(vertexNormals);
}

//
// Tree.prototype.getColor = function() {
//     if(selected) {
//         return [0.0, 1.0, 0.0];
//     }
//     else {
//         return this.color;
//     }
// }

// Set scale to s
Tree.prototype.setScale = function(s) {
    if(s < 0.5) {
        this.scale = 0.5;
    }
    else if(s > 2.0) {
        this.scale = 2.0;
    }
    else {
        this.scale = s;
    }
}

// Set translation to [x, y, z]
Tree.prototype.setTranslation = function(x, y, z) {
    this.translation = [x, y, z];
}

// Change translation by [x, y, z]
Tree.prototype.changeTranslation = function(dX, dY, dZ) {
    var x = this.translation[0];
    var y = this.translation[1];
    var z = this.translation[2];

    this.translation = [x + dX, y + dY, z + dZ];
}

// Set rotation to [x, y, z]
Tree.prototype.setRotation = function(x, y, z) {
    this.rotation = [x, y, z];
}

// Change rotation by [x, y, z]
Tree.prototype.changeRotation = function(dX, dY, dZ) {
    var x = this.rotation[0];
    var y = this.rotation[1];
    var z = this.rotation[2];

    this.rotation = [x + dX, y + dY, z + dZ];
}

// Return a string representation of the Tree
Tree.prototype.toString = function() {
    var data = "";

    data = data.concat(this.level + ",");
    data = data.concat(this.color + ",");
    data = data.concat(this.glossiness + ",");

    data = data.concat(this.scale + ",");
    data = data.concat(this.translation + ",");
    data = data.concat(this.rotation + "\n");

    return data;
}
