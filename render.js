// common variables
var gl;
var flatShaderProgram;
var gouraudShaderProgram;
var phongShaderProgram;
var blinnShaderProgram;
var toonShaderProgram;
var outlineShaderProgram;
var textureShaderProgram;

var mvMatrix = mat4.create();
var pMatrix  = mat4.create();

var yourTexture;

var models = {};
var objectConfig = [
    { shader: 'flat', shear: [0, 0, 0, 0, 0, 0], scale: [1, 1, 1], rotate:{axis: [0, 0, 0], degree: 180, lastTime: new Date().getTime(), lastAngle: 0, autorotate: true, direction: [0, 1, 0] }, constant: { Ka: 0.1, Kd: 0.1, Ks: 0.1, Shininess: 5 }, location: [-35, 0 ,-80], model: "Teapot" },
    { shader: 'gouraud', shear: [0, 0, 0, 0, 0, 0], scale: [1, 1, 1], rotate:{axis: [0, 0, 0],  degree: 180, lastTime: new Date().getTime(), lastAngle: 0, autorotate: true, direction: [0, 1, 0] }, constant: { Ka: 0.1, Kd: 0.1, Ks: 0.1, Shininess: 5 }, location: [0, 0 ,-80], model: "Teapot" },
    { shader: 'phong', shear: [0, 0, 0, 0, 0, 0], scale: [1, 1, 1], rotate:{axis: [0, 0, 0],  degree: 180, lastTime: new Date().getTime(), lastAngle: 0, autorotate: true, direction: [0, 1, 0] }, constant: { Ka: 0.1, Kd: 0.1, Ks: 0.1, Shininess: 5 }, location: [35, 0 ,-80], model: "Teapot" }
]

var teapotAngle = 180;
var lastTime    = 0;

var ka = 0.1;
var kd = 0.1;
var ks = 0.1;
var Shininess = 0.1;
var light_locations1 = new Float32Array([30., 20., -25.]);
var light_locations2 = new Float32Array([30., 20., -25.]);
var light_locations3 = new Float32Array([30., 20., -25.]);


//*************************************************
// Initialization functions
//*************************************************
function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        gl.getExtension('OES_standard_derivatives');
        gl.viewportWidth  = canvas.width;
        gl.viewportHeight = canvas.height;
    } 
    catch (e) {
        console.log(e);
    }

    if (!gl) {
        alert("Could not initialise WebGL");
    }
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var shaderSource = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            shaderSource += k.textContent;
        }

        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } 
    else if (shaderScript.type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } 
    else {
        return null;
    }

    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders(shaderType) {
    var fragmentShader = getShader(gl, shaderType + "fragmentShader");
    var vertexShader = getShader(gl, shaderType + "vertexShader");

    let shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vertexFrontColorAttribute = gl.getAttribLocation(shaderProgram, "aFrontColor");
    gl.enableVertexAttribArray(shaderProgram.vertexFrontColorAttribute);
    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    gl.uniform1f(gl.getUniformLocation(shaderProgram, "Ka"), ka);
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "Kd"), kd);
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "Ks"), ks);
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightPosition1"), light_locations1);
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightPosition2"), light_locations2);
    gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightPosition3"), light_locations3);
    shaderProgram.Shininess  = gl.getUniformLocation(shaderProgram, "Shininess");

    shaderProgram.pMatrixUniform  = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    if (shaderProgram.textureCoordAttribute !== -1) {
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
    }

    return shaderProgram;
}

function initTexture() {
    yourTexture = gl.createTexture();
    var image = new Image();
    image.src = "./model/metal1.jpg";  // adjust the path
    image.onload = function () {
        handleTextureLoaded(image, yourTexture);
    };
    console.log('Texture loaded');
    
}

function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // Flip the image's y-axis
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                  gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function setMatrixUniforms(shaderProgram) {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function handleLoadedModel(modelData, name) {
    let modelVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.vertexPositions), gl.STATIC_DRAW);
    modelVertexPositionBuffer.itemSize = 3;
    modelVertexPositionBuffer.numItems = modelData.vertexPositions.length / 3;

    let modelVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.vertexNormals), gl.STATIC_DRAW);
    modelVertexNormalBuffer.itemSize = 3;
    modelVertexNormalBuffer.numItems = modelData.vertexNormals.length / 3;

    let modelVertexFrontColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexFrontColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.vertexFrontcolors), gl.STATIC_DRAW);
    modelVertexFrontColorBuffer.itemSize = 3;
    modelVertexFrontColorBuffer.numItems = modelData.vertexFrontcolors.length / 3;

    let modelVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelData.vertexTextureCoords), gl.STATIC_DRAW);
    modelVertexTextureCoordBuffer.itemSize = 2;
    modelVertexTextureCoordBuffer.numItems = modelData.vertexTextureCoords.length / 2;

    models[name] = {
        modelVertexPositionBuffer: modelVertexPositionBuffer,
        modelVertexNormalBuffer: modelVertexNormalBuffer,
        modelVertexFrontColorBuffer: modelVertexFrontColorBuffer,
        modelVertexTextureCoordBuffer: modelVertexTextureCoordBuffer
    }
}

function loadModel(model) {
    if(model == 'Hide') return;
    var request = new XMLHttpRequest();
    request.open("GET", "./model/" + model + ".json");
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            handleLoadedModel(JSON.parse(request.responseText), model);
        }
    }
    request.send();
}


//*************************************************
// Rendering functions
//*************************************************
/*
    TODO HERE:
    add two or more objects showing on the canvas
    (it needs at least three objects showing at the same time)
*/
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    //gl.clearColor(ka, ka, ka, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Setup Projection Matrix
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);


    for(let i = 0; i < 3; i++){
        let shaderProgram = getShaderByName(objectConfig[i]['shader']);
        if(objectConfig[i]['shader'] == "outline"){
            shaderProgram = getShaderByName("toon");
        }

        let model_name = objectConfig[i]['model'];
        // load specific model
        //console.log(i, model_name, objectConfig[i]['shader']);
        if(!models.hasOwnProperty(model_name)){
            return;
        }
        

        let modelVertexPositionBuffer = models[model_name].modelVertexPositionBuffer;
        let modelVertexNormalBuffer = models[model_name].modelVertexNormalBuffer;
        let modelVertexFrontColorBuffer = models[model_name].modelVertexFrontColorBuffer;

        // Setup Model-View Matrix
        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, [0,0,0]);
        mat4.translate(mvMatrix, objectConfig[i]['location']);
        
        var rotateVec_init = [0,0,0];
        mat4.rotate(mvMatrix, degToRad(rotateVec_init[0]), [1, 0, 0]);
        mat4.rotate(mvMatrix, degToRad(rotateVec_init[1]), [0, 1, 0]);
        mat4.rotate(mvMatrix, degToRad(rotateVec_init[2]), [0, 0, 1]);
        
        var rotateVec = objectConfig[i].rotate.axis;
        mat4.rotate(mvMatrix, degToRad(rotateVec[0]), [1, 0, 0]);
        mat4.rotate(mvMatrix, degToRad(rotateVec[1] + teapotAngle), [0, 1, 0]);
        mat4.rotate(mvMatrix, degToRad(rotateVec[2]), [0, 0, 1]);

        // Apply Scaling
        var scaleVec = objectConfig[i].scale;
        mat4.scale(mvMatrix, scaleVec);

        // Apply Shear
        var shearMat = getShearMatrix(objectConfig[i].shear);
        mat4.multiply(mvMatrix, shearMat, mvMatrix);

        gl.useProgram(shaderProgram);
        setMatrixUniforms(shaderProgram);

        // Setup teapot position data
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
        modelVertexPositionBuffer.itemSize, 
                            gl.FLOAT, 
                            false, 
                            0, 
                            0);

        // Setup teapot front color data
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexFrontColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexFrontColorAttribute, 
                            modelVertexFrontColorBuffer.itemSize, 
                            gl.FLOAT, 
                            false, 
                            0, 
                            0);
        
        // Setup teapot normal data
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
        modelVertexNormalBuffer.itemSize, 
                            gl.FLOAT, 
                            false, 
                            0, 
                            0);

        // Setup ambient light and light position
        gl.uniform1f(gl.getUniformLocation(shaderProgram, "Ka"), ka);
        gl.uniform1f(gl.getUniformLocation(shaderProgram, "Kd"), kd);
        gl.uniform1f(gl.getUniformLocation(shaderProgram, "Ks"), ks);
        gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightPosition1"), light_locations1);
        gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightPosition2"), light_locations2);
        gl.uniform3fv(gl.getUniformLocation(shaderProgram, "lightPosition3"), light_locations3);
        gl.uniform1f(gl.getUniformLocation(shaderProgram, "Shininess"), Shininess);

        // Pass 3D Clipping Planes
        const clippingPlane = [0.0, 1.0, 0.0, update_clip_planes()];
        gl.uniform4fv(gl.getUniformLocation(shaderProgram, "uClippingPlane"), new Float32Array(clippingPlane));

        // Pass texture coordinates
        if (objectConfig[i].shader === "texture") {
            let modelVertexTextureCoordBuffer = models[model_name].modelVertexTextureCoordBuffer;
            gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexTextureCoordBuffer);
            gl.vertexAttribPointer(shaderProgram.textureCoordAttribute,
                                   modelVertexTextureCoordBuffer.itemSize,
                                   gl.FLOAT, false, 0, 0);
        
            // Bind texture (assumes you already loaded it, see next step)
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, yourTexture);
            gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);
        }

        gl.drawArrays(gl.TRIANGLES, 0, modelVertexPositionBuffer.numItems);

        // Draw outline
        if(objectConfig[i]['shader']== "outline"){
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.FRONT); // only draw back-facing faces

            shaderProgram = getShaderByName("outline");
            gl.useProgram(shaderProgram);

            gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexNormalBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

            // Only need MVP matrices
            setMatrixUniforms(shaderProgram);

            gl.drawArrays(gl.TRIANGLES, 0, modelVertexPositionBuffer.numItems);

            gl.disable(gl.CULL_FACE);
        }
    }
}


function getShaderByName(name){
    if(name == "flat"){
        return flatShaderProgram;
    }
    if(name == "gouraud"){
        return gouraudShaderProgram;
    }
    if(name == "phong"){
        return phongShaderProgram;
    }
    if(name == "blinn"){
        return blinnShaderProgram;
    }
    if(name == "toon"){
        return toonShaderProgram;
    }
    if(name == "outline"){
        return outlineShaderProgram;
    }
    if(name == "texture"){
        return textureShaderProgram;
    }
    throw "Unknown Shader";
}

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
        teapotAngle += 0.03 * elapsed;
    }
    
    lastTime = timeNow;
}

function tick() {
    requestAnimFrame(tick);
    drawScene();
    animate();
}

function webGLStart() {
    var canvas = document.getElementById("ICG-canvas");
    initGL(canvas);
    initTexture();
    flatShaderProgram = initShaders("flat");
    gouraudShaderProgram = initShaders("gouraud");
    phongShaderProgram = initShaders("phong");
    blinnShaderProgram = initShaders("blinn");
    toonShaderProgram = initShaders("toon");
    outlineShaderProgram = initShaders("outline");
    textureShaderProgram = initShaders("texture");
    loadModel('Teapot');

    gl.clearColor(ka, ka, ka, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
}


//*************************************************
// Parsing parameters
//*************************************************
function update_ambient_light(){
    ka = document.getElementById("am_ka").value;
    kd = document.getElementById("am_kd").value;
    ks = document.getElementById("am_ks").value;
    Shininess = document.getElementById("am_shininess").value;
}

function update_light_location(){
    light_locations1[0] = document.getElementById("lloc1X").value;
    light_locations1[1] = document.getElementById("lloc1Y").value;
    light_locations1[2] = document.getElementById("lloc1Z").value;

    light_locations2[0] = document.getElementById("lloc2X").value;
    light_locations2[1] = document.getElementById("lloc2Y").value;
    light_locations2[2] = document.getElementById("lloc2Z").value;

    light_locations3[0] = document.getElementById("lloc3X").value;
    light_locations3[1] = document.getElementById("lloc3Y").value;
    light_locations3[2] = document.getElementById("lloc3Z").value;
}

function updateShaderForObject(index, name) {
    objectConfig[index].shader = name;
}

function updateModelForObject(index, name) {
    objectConfig[index].model = name;
    loadModel(name); // Make sure the model is loaded
}

function update_trans(index, axis, value){
    objectConfig[index].location[axis] = value;
}

function update_rotate(index, axis, value){
    objectConfig[index].rotate.axis[axis] = value;
}

function update_scale(index, axis, value){
    objectConfig[index].scale[axis] = value;
}

function getShearMatrix(shearValues) {
    let shearMat = mat4.create();
    mat4.identity(shearMat);

    shearMat[1] = shearValues[2]; // shYX
    shearMat[2] = shearValues[4]; // shZX
    shearMat[4] = shearValues[0]; // shYX
    shearMat[6] = shearValues[5]; // shZY
    shearMat[8] = shearValues[1]; // shXZ
    shearMat[9] = shearValues[3]; // shYZ

    return shearMat;
}

function update_shear(index, axis, value){ 
    objectConfig[index].shear[axis] = value;
    
    var shXY = parseFloat(document.getElementById("shearXY").value);
    var shXZ = parseFloat(document.getElementById("shearXZ").value);
    var shYX = parseFloat(document.getElementById("shearYX").value);
    var shYZ = parseFloat(document.getElementById("shearYZ").value);
    var shZX = parseFloat(document.getElementById("shearZX").value);
    var shZY = parseFloat(document.getElementById("shearZY").value);

    return [shXY, shXZ, shYX, shYZ, shZX, shZY];
}

function update_clip_planes() {
    /*clipMinX = parseFloat(document.getElementById("clipMinX").value);
    clipMaxX = parseFloat(document.getElementById("clipMaxX").value);
    clipMinY = parseFloat(document.getElementById("clipMinY").value);
    clipMaxY = parseFloat(document.getElementById("clipMaxY").value);
    clipMinZ = parseFloat(document.getElementById("clipMinZ").value);
    clipMaxZ = parseFloat(document.getElementById("clipMaxZ").value);

    return new Float32Array([
        1, 0, 0, -clipMinX,  // X-min plane: x >= clipMinX
        -1, 0, 0, clipMaxX,  // X-max plane: x <= clipMaxX
        0, 1, 0, -clipMinY,  // Y-min plane: y >= clipMinY
        0, -1, 0, clipMaxY,  // Y-max plane: y <= clipMaxY
        0, 0, 1, -clipMinZ,  // Z-min plane: z >= clipMinZ
        0, 0, -1, clipMaxZ   // Z-max plane: z <= clipMaxZ
    ]);*/
    return parseFloat(document.getElementById("clipX").value);
}