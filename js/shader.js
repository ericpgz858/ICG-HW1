const flatFragment = `
precision highp float;

uniform vec3 lightColor1;
uniform vec3 lightColor2;
uniform vec3 lightColor3;
uniform vec4 lightPosition1;
uniform vec4 lightPosition2;
uniform vec4 lightPosition3;

uniform float Ka;
uniform float Kd;
uniform float Ks;
uniform float Shininess;

varying vec4 fragcolor;
varying vec3 normal;
varying vec3 mvVertex;

void main(void) {
    vec3 ambient_color = Ka * vec3(fragcolor);

    vec3 lightDirection1 = normalize(vec3(lightPosition1) - mvVertex);
    float diffuseCos1 = max(dot(normal, lightDirection1), 0.0);
    vec3 diffuseColor1 = lightColor1 * Kd * vec3(fragcolor) * diffuseCos1;

    vec3 lightDirection2 = normalize(vec3(lightPosition2) - mvVertex);
    float diffuseCos2 = max(dot(normal, lightDirection2), 0.0);
    vec3 diffuseColor2 = lightColor2 * Kd * vec3(fragcolor) * diffuseCos2;

    vec3 lightDirection3 = normalize(vec3(lightPosition3) - mvVertex);
    float diffuseCos3 = max(dot(normal, lightDirection3), 0.0);
    vec3 diffuseColor3 = lightColor3 * Kd * vec3(fragcolor) * diffuseCos3;

    vec3 color = ambient_color + diffuseColor1 + diffuseColor2 + diffuseColor3;
    gl_FragColor = vec4(color, 1.0);
}
`;


const flatVertex = `
attribute vec3 aVertexPosition;
attribute vec3 aFrontColor;
attribute vec3 aVertexNormal; // Now passing precomputed normals

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec4 fragcolor;
varying vec3 normal;
varying vec3 mvVertex;

void main(void) {
    mvVertex = (uMVMatrix * vec4(aVertexPosition, 1.0)).xyz;
    normal = normalize(mat3(uMVMatrix) * aVertexNormal); // Use precomputed normal
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    fragcolor = vec4(aFrontColor.rgb, 1.0);
}
`;

const gouraudVertex = `
attribute vec3 aVertexPosition;
attribute vec3 aFrontColor;
attribute vec3 aVertexNormal;

uniform vec3 lightColor1;
uniform vec3 lightColor2;
uniform vec3 lightColor3;
uniform vec4 lightPosition1;
uniform vec4 lightPosition2;
uniform vec4 lightPosition3;

uniform float Ka;
uniform float Kd;
uniform float Ks;
uniform float Shininess;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec4 fragcolor;

void main(void) {
    vec3 mvVertex =  (uMVMatrix * vec4(aVertexPosition, 1.0)).xyz;
    mat3 normalMatrix = mat3(uMVMatrix);
    vec3 mvNormal =  (normalMatrix * aVertexNormal);

    // gouraud = ambient + diffuse + specular
    // prepare
    vec3 gouraud = vec3(0.0);
    vec3 cameraDirection = - normalize(mvVertex);
    vec3 normal = normalize(mvNormal);

    vec3 lightDirection1 = normalize(vec3(lightPosition1) - mvVertex);
    vec3 H1 = normalize(lightDirection1+cameraDirection);
    vec3 lightDirection2 = normalize(vec3(lightPosition2) - mvVertex);
    vec3 H2 = normalize(lightDirection2+cameraDirection);
    vec3 lightDirection3 = normalize(vec3(lightPosition3) - mvVertex);
    vec3 H3 = normalize(lightDirection3+cameraDirection);

    // ambient
    vec3 ambient = aFrontColor * Ka;
    
    // diffuse
    vec3 diffuse1 = lightColor1 * aFrontColor * max(dot(lightDirection1, normal), 0.0) * Kd;
    vec3 diffuse2 = lightColor2 * aFrontColor * max(dot(lightDirection2, normal), 0.0) * Kd;
    vec3 diffuse3 = lightColor3 * aFrontColor * max(dot(lightDirection3, normal), 0.0) * Kd;

    // specular
    vec3 specular1 = lightColor1 * pow(max(dot(H1, normal), 0.0), Shininess) * Ks;
    vec3 specular2 = lightColor2 * pow(max(dot(H2, normal), 0.0), Shininess) * Ks;
    vec3 specular3 = lightColor3 * pow(max(dot(H3, normal), 0.0), Shininess) * Ks;

    vec3 color = ambient + diffuse1 + diffuse2 + diffuse3 + specular1 + specular2 + specular3;

    fragcolor = vec4(color, 1.0);
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}
`

const gouraudFragment = `
precision mediump float;
varying vec4 fragcolor;

void main(void) {
    gl_FragColor = fragcolor;
}
`

const phongFragment = `
precision mediump float;

uniform vec3 lightColor1;
uniform vec3 lightColor2;
uniform vec3 lightColor3;
uniform vec4 lightPosition1;
uniform vec4 lightPosition2;
uniform vec4 lightPosition3;

uniform float Ka;
uniform float Kd;
uniform float Ks;
uniform float Shininess;

varying vec4 fragcolor;
varying vec3 normal;
varying vec3 mvVertex;

void main(void) {
    /* ambient */
    vec3  ambientColor = Ka * vec3(fragcolor);
    
    /* diffuse */
    vec3 lightDirection1 = normalize(vec3(lightPosition1) - mvVertex);
    float diffuseCos1 = max(dot(normal, lightDirection1),0.0);
    vec3 diffuseColor1 = lightColor1 * Kd * vec3(fragcolor) * diffuseCos1;
    
    vec3 lightDirection2 = normalize(vec3(lightPosition2) - mvVertex);
    float diffuseCos2 = max(dot(normal, lightDirection2),0.0);
    vec3 diffuseColor2 = lightColor2 * Kd * vec3(fragcolor) * diffuseCos2;
    
    vec3 lightDirection3 = normalize(vec3(lightPosition3) - mvVertex);
    float diffuseCos3 = max(dot(normal, lightDirection3),0.0);
    vec3 diffuseColor3 = lightColor3 * Kd * vec3(fragcolor) * diffuseCos3;
    
    /* specular */
    vec3 cameraDirection = normalize(-mvVertex);

    vec3 reflectionDirection1 = reflect(-lightDirection1, normal);
    float specularCosN1 = pow(max(dot(reflectionDirection1, cameraDirection), 0.0), Shininess);
    vec3 specularColor1 = Ks * lightColor1 * specularCosN1;
    
    vec3 reflectionDirection2 = reflect(-lightDirection2, normal);
    float specularCosN2 = pow(max(dot(reflectionDirection2, cameraDirection), 0.0), Shininess);
    vec3 specularColor2 = Ks * lightColor2 * specularCosN2;
    
    vec3 reflectionDirection3 = reflect(-lightDirection3, normal);
    float specularCosN3 = pow(max(dot(reflectionDirection3, cameraDirection), 0.0), Shininess);
    vec3 specularColor3 = Ks * lightColor3 * specularCosN3;
    
    vec3 color = ambientColor + diffuseColor1 + diffuseColor2 + diffuseColor3 + specularColor1 + specularColor2 + specularColor3;

    gl_FragColor = vec4(color,1.0);
}
`

const phongVertex = `
attribute vec3 aVertexPosition;
attribute vec3 aFrontColor;
attribute vec3 aVertexNormal;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec3 normal;
varying vec4 fragcolor;
varying vec3 mvVertex;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    mvVertex = (uMVMatrix * vec4(aVertexPosition, 1.0)).xyz;
    normal = normalize(mat3(uMVMatrix) * aVertexNormal);
    fragcolor = vec4(aFrontColor,1.0);
}
`

let shaderSourceCode = {
    "flat": { "vertex": flatVertex, "fragment": flatFragment },
    "gouraud": { "vertex": gouraudVertex, "fragment": gouraudFragment },
    "phong": { "vertex": phongVertex, "fragment": phongFragment },
}

const shaders = {
    flat: {
        vertex: flatVertex,
        fragment: flatFragment
    },
    gouraud: {
        vertex: gouraudVertex,
        fragment: gouraudFragment
    },
    phong: {
        vertex: phongVertex,
        fragment: phongFragment
    }
};

// Make shaders accessible from other scripts
if (typeof module !== "undefined") {
    module.exports = shaders;
}