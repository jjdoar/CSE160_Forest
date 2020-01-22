// Jacob Baginski Doar
// jjbagins@ucsc.edu
// 11/13/2019
// PointLight.js

var PointLight = function(radius, color, lightColor) {
    this.color = color;
    this.lightColor = lightColor;
    this.glossiness = 100.0;

    this.vertices = [];
    this.indices = [];

    this.translation = [0.0, 0.0, 0.0];
    this.lightOn = 1;

    this.createSphere(radius);
}

// Create a sphere by populating the vertices,
// surface normals, and vertex normals array
PointLight.prototype.createSphere = function(radius) {
    var sphereDivisions = 13;

    var ai, si, ci;
    var aj, sj, cj;
    var p1, p2;

    // Generate coordinates
    for (var j = 0; j <= sphereDivisions; j++) {
        aj = j * Math.PI / sphereDivisions;
        sj = Math.sin(aj);
        cj = Math.cos(aj);
        for (var i = 0; i <= sphereDivisions; i++) {
            ai = i * 2 * Math.PI / sphereDivisions;
            si = Math.sin(ai);
            ci = Math.cos(ai);

            this.vertices.push(radius * si * sj);  // X
            this.vertices.push(radius * cj);       // Y
            this.vertices.push(radius * ci * sj);  // Z
        }
    }

    // Generate indices
    for (var j = 0; j < sphereDivisions; j++) {
        for (var i = 0; i < sphereDivisions; i++) {
            p1 = j * (sphereDivisions + 1) + i;
            p2 = p1 + (sphereDivisions + 1);

            this.indices.push(p1);
            this.indices.push(p2);
            this.indices.push(p1 + 1);

            this.indices.push(p1 + 1);
            this.indices.push(p2);
            this.indices.push(p2 + 1);
        }
    }

    //console.log("Vertices: ", this.vertices);
    //console.log("Indices: ", this.indices);
}

// Set translation to [x, y, z]
PointLight.prototype.setTranslation = function(x, y, z) {
    this.translation = [x, y, z];
}

// Change translation by [x, y, z]
PointLight.prototype.changeTranslation = function(dX, dY, dZ) {
    var x = this.translation[0];
    var y = this.translation[1];
    var z = this.translation[2];

    this.translation = [x + dX, y + dY, z + dZ];
}

// Return a string representation of the point light
PointLight.prototype.toString = function() {
    var data = "";

    data = data.concat(this.radius + ",");
    data = data.concat(this.color + ",");
    data = data.concat(this.lightColor + ",");
    data = data.concat(this.glossiness + ",");

    data = data.concat(this.translation + ",");

    return data;
}
