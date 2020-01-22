// Jacob Baginski Doar
// jjbagins@ucsc.edu
// 11/13/2019
// Forest.js

var forest = [new PointLight(5.0, [1.0, 1.0, 0.0], [0.5, 0.5, 1.0])];   // An array of Tree objects
                                                                        // The first index stores the point light
var newForest = []; // Used to load in scenes

var redTreeLevel = 3;
var blueTreeLevel = 4;

var view = 0;   // Top view by default
var proj = 0;   // Orthographic projection by default
var mode = 0;   // Flat shading by default

var canvasWidth, canvasHeight;
var spanX = 200, spanY = 200;
var aspectRatio = 1;
var origin = [500.0, 500.0, 0.0];

var cameraLocation = [0.0, 0.0, 400.0];
var cameralookAt = [0.0, 0.0, 0.0];
var cameraFOV = 60;

var selected = 0;
var selectedTreeIndex = -1;

// Used to keep track of mouse movement while dragging mouse
var clickStartX = Math.infinity; clickStartY = Math.infinity;

function main() {
    // Retrieve canvas element
    var canvas = document.getElementById("webgl");
    if(!canvas) {
        console.log("Failed to retrieve <canvas> element");
        return;
    }
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;

    // Retrieve rendering context
    var gl = getWebGLContext(canvas);
    if(!gl) {
        console.log("Failed to retrieve rendering context for WebGL");
        return;
    }

    // Initialize shaders
    if(!initShaders(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE)) {
        console.log("Failed to initialize shaders");
        return;
    }

    // Set the clear color and enable the depth test
    gl.clearColor(0.0, 0.5, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    // Get uniform locations
    var u_DirectionalLightColor = getUniformLocation(gl, "u_DirectionalLightColor");
    var u_DirectionalLightDirection = getUniformLocation(gl, "u_DirectionalLightDirection");
    var u_ViewerDirection = getUniformLocation(gl, "u_ViewerDirection");

    var u_Clicked = getUniformLocation(gl, "u_Clicked");

    // Set the light color and direction
    gl.uniform3f(u_DirectionalLightColor, 1.0, 1.0, 1.0);
    var lightDirection = [1.0, 1.0, 1.0];
    lightDirection = vec3Normalize(lightDirection[0], lightDirection[1], lightDirection[2]);
    gl.uniform3fv(u_DirectionalLightDirection, lightDirection);

    // Set the point lights location
    forest[0].setTranslation(0, -100.0, 100.0);

    // Pass false to clicked
    gl.uniform1i(u_Clicked, 0);

    // TESTING
    //forest[1].setTranslation(50.0, 50.0, 0.0);
    draw(gl);
    // END TESTING

    // View
    var viewCheck = document.getElementById("viewCheck");
    viewCheck.addEventListener('change', function() {
        if(viewCheck.checked) {
            view = 1;
            cameraLocation = [0.0, -400.0, 75.0];
            cameralookAt = [0.0, 0.0, 75.0];
            console.log("Side view");
        }
        else {
            view = 0;
            cameraLocation = [0.0, 0.0, 400.0];
            cameralookAt = [0.0, 0.0, 0.0];
            console.log("Top view");
        }
        draw(gl);
    });

    // Projection mode
    var projectionCheck = document.getElementById("projectionCheck");
    projectionCheck.addEventListener('change', function() {
        if(projectionCheck.checked) {
            proj = 1;
            console.log("Perspective mode");
        }
        else {
            proj = 0;
            console.log("Orthographic mode");
        }
        draw(gl);
    });

    // Rendering mode
    var renderingModeSelect = document.getElementById("renderingModeSelect");
    renderingModeSelect.addEventListener('change', function() {
        switch(renderingModeSelect.options[renderingModeSelect.selectedIndex].value) {
            case "0":     // Flat shading
                mode = 0;
                console.log("Flat shading mode");
                break;
            case "1":     // Smooth shading
                mode = 1;
                console.log("Smooth shading mode");
                break;
            case "2":     // Wireframe
                mode = 2;
                console.log("Wireframe mode");
                break;
            default:    // Default to flat shading
                mode = 0;
                console.log("Defaulting to flat shading mode");
                break;
        }
        draw(gl);
    });

    // Load
    var submit = document.getElementById("loadButton");
    submit.addEventListener('click', function() {
        forest = [new PointLight(5.0, [1.0, 1.0, 0.0], [0.5, 0.5, 1.0])];
        forest = forest.concat(newForest);
        draw(gl);
    });

    // New Scence
    var newButton = document.getElementById("newButton");
    newButton.addEventListener('click', function() {
        draw(gl);
    });

    // Canvas click down
    canvas.onmousedown = function(ev) {
        var x = ev.clientX, y = ev.clientY;
        var rect = ev.target.getBoundingClientRect();
        var xInCanvas = x - rect.left, yInCanvas = rect.bottom - y;

        var button = ev.which;
        switch(button) {
            case 1:     // Left click
                leftClickDown(gl, u_Clicked, xInCanvas, yInCanvas);
                break;
            case 2:     // Middle click
                middleClickDown(gl, u_Clicked, xInCanvas, yInCanvas);
                break;
            case 3:     // Right click
                rightClickDown(gl, u_Clicked, xInCanvas, yInCanvas);
                break;
            default:
                return;
        }
    }

    // Canvas click up
    canvas.onmouseup = function(ev) {
        var x = ev.clientX, y = ev.clientY;
        var rect = ev.target.getBoundingClientRect();
        var xInCanvas = x - rect.left, yInCanvas = rect.bottom - y;

        var button = ev.which;
        switch (button) {
            case 1:     // Left click
                leftClickUp(gl, xInCanvas, yInCanvas);
                break;
            case 2:     // Middle click
                middleClickUp(gl, xInCanvas, yInCanvas);
                break;
            case 3:     // Right click
                rightClickUp(gl, xInCanvas, yInCanvas);
                break;
            default:
                return;
        }
    }

    // Canvas context menu
    canvas.oncontextmenu = function(ev) {
        return false;
    }

    // Canvas scroll wheel
    canvas.addEventListener("wheel", function(ev) {
        const delta = Math.sign(ev.deltaY) * -1;
        scrollWheel(gl, delta);
    }, {passive: true});
}

//
function leftClickDown(gl, u_Clicked, x, y) {
    // Draw with pick colors
    gl.uniform1i(u_Clicked, 1);
    draw(gl);

    // Read pixel at click location
    var pixels = new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Nothing selected
    var index = clickedOnTree(pixels[0]);
    var worldPos = canvasCoordinatesToWorld(x, y, canvasWidth, canvasHeight, spanX, spanY, cameraLocation[0], cameraLocation[1]);
    // Nothing selected
    if(selected == 0) {
        // Clicked on a tree
        if(index > -1) {
            // Select the clicked tree
            selected = 1;
            selectedTreeIndex = index;
        }
        // Clicked on background
        else {
            // Save click start position
            clickStartX = worldPos[0];
            clickStartY = worldPos[1];
        }
    }
    // Something already selected
    else {
        // Clicked on selected tree
        if(index == selectedTreeIndex) {
            // Save click start position
            clickStartX = worldPos[0];
            clickStartY = worldPos[1];
        }
        // Click on background
        else if(index == -1){
            // Deselect tree
            selectedTreeIndex = -1;
            selected = 0;
        }
    }

    // Draw with normal colors
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1i(u_Clicked, 0);
    draw(gl);
}

//
function leftClickUp(gl, x, y) {
    // Calculate mouse position change
    var clickEndWorldPos = canvasCoordinatesToWorld(x, y, canvasWidth, canvasHeight, spanX, spanY, cameraLocation[0], cameraLocation[1]);
    var dX = clickEndWorldPos[0] - clickStartX;
    var dY = clickEndWorldPos[1] - clickStartY;

    // Something selected
    if(selected == 1 && clickStartX != Math.infinity && clickStartY != Math.infinity) {
        // Translate xy
        forest[selectedTreeIndex].changeTranslation(dX, dY, 0.0);
    }
    // Nothing selected
    else {
        var cameraSensitivity = 10.0    // The mouse must have moved more than this value to move camera rather then place a tree
        // Move camera along XY
        if(dX > cameraSensitivity || dX < -cameraSensitivity || dY > cameraSensitivity || dY < -cameraSensitivity) {
            cameraLocation[0] -= dX;
            cameraLocation[1] -= dY;

            cameralookAt[0] -= dX;
            cameralookAt[1] -= dY;
        }
        else {
            // Create a new red tree and add it to the forest
            var newTree = new Tree(redTreeLevel, [1.0, 0.0, 0.0], 5);
            newTree.setTranslation(clickEndWorldPos[0], clickEndWorldPos[1], 0.0);
            forest = forest.concat(newTree);
        }
    }

    // Reset click start variables
    clickStartX = Math.infinity;
    clickStartY = Math.infinity;

    draw(gl);
}

//
function middleClickDown(gl, u_Clicked, x, y) {
    // Draw with pick colors
    gl.uniform1i(u_Clicked, 1);
    draw(gl);

    // Read pixel at click location
    var pixels = new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    var index = clickedOnTree(pixels[0]);
    var worldPos = canvasCoordinatesToWorld(x, y, canvasWidth, canvasHeight, spanX, spanY, cameraLocation[0], cameraLocation[1]);

    // Save click start position
    clickStartX = worldPos[0];
    clickStartY = worldPos[1];

    // Draw with normal colors
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1i(u_Clicked, 0);
    draw(gl);
}

//
function middleClickUp(gl, x, y) {
    var clickEndWorldPos = canvasCoordinatesToWorld(x, y, canvasWidth, canvasHeight, spanX, spanY, cameraLocation[0], cameraLocation[1]);
    var dY = clickEndWorldPos[1] - clickStartY;

    // Something selected
    if(selected == 1 && clickStartX != Math.infinity && clickStartY != Math.infinity) {
        // Translate z
        forest[selectedTreeIndex].changeTranslation(0.0, 0.0, dy);
    }
    // Nothing selected
    else {
        // Move camera along XY
        cameraLocation[2] -= dY;
    }

    // Reset click start variables
    clickStartX = Math.infinity;
    clickStartY = Math.infinity;

    draw(gl);
}

//
function rightClickDown(gl, u_Clicked, x, y) {
    // Draw with pick colors
    gl.uniform1i(u_Clicked, 1);
    draw(gl);

    // Read pixel at click location
    var pixels = new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    var index = clickedOnTree(pixels[0]);
    var worldPos = canvasCoordinatesToWorld(x, y, canvasWidth, canvasHeight, spanX, spanY, cameraLocation[0], cameraLocation[1]);
    // Nothing selcted
    if(selected == 0) {
        // Clicked on background
        if(index == -1) {
            // Create a new red tree and add it to the forest
            var newTree = new Tree(blueTreeLevel, [0.0, 0.0, 1.0], 20);
            newTree.setTranslation(worldPos[0], worldPos[1], 0.0);
            forest = forest.concat(newTree);
        }
    }
    // Something selected
    else {
        // Clicked on point light
        if(index == 0) {
            // Toggle light
            if(forest[0].lightOn == 1) {
                forest[0].lightOn = 0;
                console.log("Turned light off");
            }
            else {
                forest[0].lightOn = 1;
                console.log("Turned light on");
            }
        }

        // Clicked on selected tree
        if(index == selectedTreeIndex) {
            // Save click start position
            clickStartX = worldPos[0];
            clickStartY = worldPos[1];
        }
    }

    // Draw with normal colors
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1i(u_Clicked, 0);
    draw(gl);
}

//
function rightClickUp(gl, x, y) {
    var rotationScalar = 0.75;

    // Something selected
    if(selected == 1 && clickStartX != Math.infinity && clickStartY != Math.infinity && selectedTreeIndex > 0) {
        // Rotate xz
        var clickEndWorldPos = canvasCoordinatesToWorld(x, y, canvasWidth, canvasHeight, spanX, spanY, cameraLocation[0], cameraLocation[1]);
        var dx = clickEndWorldPos[0] - clickStartX;
        var dy = clickEndWorldPos[1] - clickStartY;

        // Horizontal movement
        if(Math.abs(dx) >= Math.abs(dy)) {
            forest[selectedTreeIndex].changeRotation(0.0, 0.0, dx * rotationScalar);
        }
        // Vertical movement
        else {
            forest[selectedTreeIndex].changeRotation(dy * rotationScalar, 0.0, 0.0);
        }

        // Reset click start variables
        clickStartX = Math.infinity;
        clickStartY = Math.infinity;

        draw(gl);
    }
}

//
function scrollWheel(gl, delta) {
    var scaleScalar = 0.2;
    var zoomScalar = 0.5;

    // Something selected
    if(selected == 1) {
        var currentScale = forest[selectedTreeIndex].scale;

        // Scale
        if((currentScale != 0.5 || delta == 1) && (currentScale != 2.0 || delta == -1) && selectedTreeIndex > 0) {
            forest[selectedTreeIndex].setScale(forest[selectedTreeIndex].scale + delta * scaleScalar);
        }
    }
    // Nothing selected
    else {
        if(cameraFOV < 10.0) {
            cameraFOV = 10.0;
        }
        else if(cameraFOV > 120.0) {
            cameraFOV = 120.0;
        }
        else {
            cameraFOV += delta * zoomScalar;
        }
    }
    draw(gl);
}

// Takes the red value of the pixel that was clicked on and
// returns a tree index if it was a tree, returns -1 otherwise
function clickedOnTree(redValue) {
    for(var i = 0; i < forest.length; i++) {
        if(redValue == 255 - i) {
            return i;
        }
    }
    return -1;
}

// Set projection and view values for mvpMatrix and pass u_ViewerDirection
function setMvpMatrix(gl, mvpMatrix) {
    // Projection
    if(proj == 0) {     // Orthographic
        mvpMatrix.setOrtho(-spanX, spanX, -spanY, spanY, 0.1, 1000.0);
    }
    else {              // Perspective
        mvpMatrix.setPerspective(cameraFOV, aspectRatio, 0.1, 1000.0);
    }

    // View
    var viewerLocation = [];
    if(view == 0) {     // Top view
        mvpMatrix.lookAt(
            origin[0] + cameraLocation[0], origin[1] + cameraLocation[1], origin[2] + cameraLocation[2],
            origin[0] + cameralookAt[0], origin[1] + cameralookAt[1], origin[2] + cameralookAt[2],
            0, 1, 0
        );
    }
    else {              // Side view
        mvpMatrix.lookAt(
            origin[0] + cameraLocation[0], origin[1] + cameraLocation[1], origin[2] + cameraLocation[2],
            origin[0] + cameralookAt[0], origin[1] + cameralookAt[1], origin[2] + cameralookAt[2],
            0, 0, 1
        );
    }

    // Set viewer direction
    viewerLocation = vec3Normalize(viewerLocation[0], viewerLocation[1], viewerLocation[2]);
    var u_ViewerDirection = getUniformLocation(gl, "u_ViewerDirection");
    gl.uniform3fv(u_ViewerDirection, viewerLocation);

    return mvpMatrix;
}

// Draw function
function draw(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    var mvpMatrix = new Matrix4();
    mvpMatrix = setMvpMatrix(gl, mvpMatrix);

    // Draw point light
    drawPointLight(gl, mvpMatrix, forest[0]);

    // Draw trees
    if(forest.length > 1) {
        for(var i = 1; i < forest.length; i++) {
            var tree = forest[i];
            drawTree(gl, mvpMatrix, tree, i);
        }
    }
}

function drawPointLight(gl, mvpMatrix, pointLight) {
    // Get uniforms
    var u_Glossiness = getUniformLocation(gl, "u_Glossiness");
    var u_Color = getUniformLocation(gl, "u_Color");
    var u_PickColor = getUniformLocation(gl, "u_PickColor");

    var u_MvpMatrix = getUniformLocation(gl, "u_MvpMatrix");
    var u_NormalMatrix = getUniformLocation(gl, "u_NormalMatrix");

    var u_PointLightColor = getUniformLocation(gl, "u_PointLightColor");
    var u_PointLightPos = getUniformLocation(gl, "u_PointLightPos");

    // Set point light color
    if(pointLight.lightOn == 1) {   // Light on
        var lightColor = pointLight.lightColor;
        gl.uniform3fv(u_PointLightColor, lightColor);
    }
    else {                          // Light off
        var lightColor = [0.1, 0.1, 0.1];
        gl.uniform3fv(u_PointLightColor, lightColor);
    }

    // Set point light position
    var position = pointLight.translation;
    gl.uniform3fv(u_PointLightPos, position);

    // Set pick color
    var pickColor = map(255 - 0, 0, 255, 0, 1);
    gl.uniform3f(u_PickColor, pickColor, 0.0, 0.0);

    // Light Selected
    if(selectedTreeIndex == 0) {
        gl.uniform1f(u_Glossiness, 0.00001);
        gl.uniform3f(u_Color, 0.0, 1.0, 0.0);
    }
    // Set light glossiness and color
    else {
        var glossiness = pointLight.glossiness;
        gl.uniform1f(u_Glossiness, glossiness);

        var color = pointLight.color;
        gl.uniform3fv(u_Color, color);
    }

    // Number of indices
    var n = pointLight.indices.length;

    // Vertex information
    var vertices = new Float32Array(pointLight.vertices);
    initializeArrayBuffer(gl, "a_Position", vertices, gl.FLOAT, 3);

    // Normal information
    var normals = new Float32Array(pointLight.vertices);
    initializeArrayBuffer(gl, "a_Normal", normals, gl.FLOAT, 3);

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Write the indices to the buffer object
    var indices = new Uint16Array(pointLight.indices);
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Transformation matrices
    var pointLightMVPMatrix = new Matrix4();
    var modelMatrix = new Matrix4();
    var normalMatrix = new Matrix4();

    // Translate
    var translate = pointLight.translation;
    modelMatrix.translate(origin[0] + translate[0], origin[1] + translate[1], origin[2] + translate[2]);

    // Pass the model view projection matrix
    pointLightMVPMatrix.set(mvpMatrix);
    pointLightMVPMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, gl.FALSE, pointLightMVPMatrix.elements);

    // Calculate and pass the normal transformation matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, gl.FALSE, normalMatrix.elements);

    // Draw the light
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
}

function drawTree(gl, mvpMatrix, tree, treeIndex) {
    // Get uniforms
    var u_Glossiness = getUniformLocation(gl, "u_Glossiness");
    var u_Color = getUniformLocation(gl, "u_Color");
    var u_PickColor = getUniformLocation(gl, "u_PickColor");

    var u_MvpMatrix = getUniformLocation(gl, "u_MvpMatrix");
    var u_NormalMatrix = getUniformLocation(gl, "u_NormalMatrix");

    // Set pick color
    var pickColor = map(255 - treeIndex, 0, 255, 0, 1);
    gl.uniform3f(u_PickColor, pickColor, 0.0, 0.0);

    // Set point light color and direction

    if(selectedTreeIndex == treeIndex) {    // Tree selected
        gl.uniform1f(u_Glossiness, 0.00001);
        gl.uniform3f(u_Color, 0.0, 1.0, 0.0);
    }
    else {  // Set tree glossiness and color based on tree level
        var glossiness = tree.glossiness;
        gl.uniform1f(u_Glossiness, glossiness);

        var color = tree.color;
        gl.uniform3fv(u_Color, color);
    }

    // Number of vertices
    var n = tree.numVertices;

    // Vertex information
    var vertices = new Float32Array(tree.vertices);
    initializeArrayBuffer(gl, "a_Position", vertices, gl.FLOAT, 3);

    // Normal information
    if(mode == 1) {     // Smooth shading
        var normals = new Float32Array(tree.vertexNormals);
    }
    else {              // Flat shading/Wireframe
        var normals = new Float32Array(tree.surfaceNormals);
    }
    initializeArrayBuffer(gl, "a_Normal", normals, gl.FLOAT, 3);

    var treeMVPMatrix = new Matrix4();
    var modelMatrix = new Matrix4();
    var normalMatrix = new Matrix4();

    // Translate
    var translate = tree.translation;
    modelMatrix.translate(origin[0] + translate[0], origin[1] + translate[1], origin[2] + translate[2]);

    // Rotate
    var rotate = tree.rotation;
    modelMatrix.rotate(rotate[0], 1.0, 0.0, 0.0);
    modelMatrix.rotate(rotate[1], 0.0, 1.0, 0.0);
    modelMatrix.rotate(rotate[2], 0.0, 0.0, 1.0);

    // Scale
    var scale = tree.scale;
    modelMatrix.scale(scale, scale, scale);

    // Pass the model view projection matrix
    treeMVPMatrix.set(mvpMatrix);
    treeMVPMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, gl.FALSE, treeMVPMatrix.elements);

    // Calculate and pass the normal transformation matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, gl.FALSE, normalMatrix.elements);

    // Draw the tree
    if(mode == 0 || mode == 1) {    // Flat shading/Smooth shading
        gl.drawArrays(gl.TRIANGLES, 0, n);
    }
    else if(mode == 2) {            // Wireframe
        gl.drawArrays(gl.LINES, 0, n);
    }
    else {
        console.log("Error: invalid draw mode: ", mode, ". Valid options {0, 1, 2}");
    }
}

// Return a string representing the forest
function forestToString() {
    var data = "";
    if(forest.length > 1) {
        for(var i = 1; i < forest.length; i++) {
            data = data.concat(forest[i].toString());
        }
    }

    return data;
}

// Create a new scene
function newScene(gl) {
    forest = [new PointLight(5.0, [1.0, 1.0, 0.0], [0.5, 0.5, 1.0])];
}

// Save a scene
function save(filename) {
  var savedata = document.createElement('a');
  savedata.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(forestToString()));
  savedata.setAttribute('download', filename);
  savedata.style.display = 'none';
  document.body.appendChild(savedata);
  savedata.click();
  document.body.removeChild(savedata);
}

// Load a scene
function load() {
    var Loadfile = document.getElementById("loadscene").files[0];
    var reader = new FileReader();
    reader.readAsText(Loadfile);
    reader.onload = function() {
        // Split file into lines
        var lines = this.result.split("\n");

        // Reset newForest incase a previous file has already been loaded
        newForest = [];
        for(var i = 0; i < lines.length - 1; i++) {
            // Split line into an array
            var line = lines[i].split(",");

            // Parse data
            var level = parseInt(line[0]);
            var color = [parseFloat(line[1]), parseFloat(line[2]), parseFloat(line[3])];
            var glossiness = parseFloat(line[4]);

            var scale = parseFloat(line[5]);
            var translation = [parseFloat(line[6]), parseFloat(line[7]), parseFloat(line[8])];
            var rotation = [parseFloat(line[9]), parseFloat(line[10]), parseFloat(line[11])];

            // Create a new tree
            var newTree = new Tree(level, color, glossiness);
            newTree.setTranslation(translation[0], translation[1], translation[2]);
            newTree.setRotation(rotation[0], rotation[1], rotation[2]);

            // Add new tree to newForest
            newForest = newForest.concat(newTree);
        }
    }
}
