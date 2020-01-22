// Jacob Baginski Doar
// jjbagins@ucsc.edu
// 11/13/2019
// SHADERS.js

// Vertex Shader
var VERTEX_SHADER_SOURCE = `
    attribute vec3 a_Position;      // Position of a vertex
    attribute vec3 a_Normal;        // Normal of a vertex

    uniform vec3 u_DirectionalLightColor;
    uniform vec3 u_DirectionalLightDirection;

    uniform vec3 u_PointLightColor;
    uniform vec3 u_PointLightPos;

    uniform vec3 u_ViewerDirection;
    uniform vec3 u_Color;           // Color of a tree
    uniform float u_Glossiness;     // level of glossiness of a surface

    uniform mat4 u_MvpMatrix;       // The model view projection matrix
    uniform mat4 u_NormalMatrix;    // The normal transformation matrix
    uniform bool u_Clicked;         // Mouse pressed
    uniform vec3 u_PickColor;       // Color to draw when mouse is clicked

    varying vec3 v_Color;

    void main() {
        gl_Position = u_MvpMatrix * vec4(a_Position, 1.0);                      // Vertex after all transformations
        vec3 normal = normalize((u_NormalMatrix * vec4(a_Normal, 1.0)).xyz);    // Vertex normal after all transformations

        // Directional light
        vec3 directionalReflection = normalize(reflect(-u_DirectionalLightDirection, a_Normal));    // Reflection between the directional light and the surface normal

        float directional_nDotL = max(dot(u_DirectionalLightDirection, normal), 0.0);               // Angle between normal and the directional light
        float directional_vDotR = max(dot(u_ViewerDirection, directionalReflection), 0.0);          // Angle between viewer and the directional reflection

        vec3 directional_Diffuse = u_DirectionalLightColor * u_Color * directional_nDotL;               // Kd is equal to u_Color in this case
        vec3 directional_Specular = u_DirectionalLightColor * pow(directional_vDotR, u_Glossiness);     // Ks is excluded because it is [1, 1, 1]

        // Point light
        vec3 pointLightDirection = normalize(u_PointLightPos - a_Position);         // Direction to the point light

        vec3 pointReflection = normalize(reflect(-pointLightDirection, a_Normal));  // Reflection between the point light and the surface normal

        float point_nDotL = max(dot(pointLightDirection, normal), 0.0);             // Angle between the normal and the point light
        float point_vDotR = max(dot(u_ViewerDirection, pointReflection), 0.0);      // Angle between the viewer and the point light

        vec3 point_Diffuse = u_PointLightColor * u_Color * point_nDotL;             // Kd is u_Color in this case
        vec3 point_Specular = u_PointLightColor * pow(point_vDotR, u_Glossiness);   // Ks is excluded because it is [1, 1, 1]

        // Set the color
        if(u_Clicked) {
            v_Color = u_PickColor;
        }
        else {
            v_Color = (directional_Diffuse + directional_Specular) + (point_Diffuse + point_Specular);
        }
    }
`

// Fragment Shader
var FRAGMENT_SHADER_SOURCE = `
    #ifdef GL_ES
        precision mediump float;
    #endif

    varying vec3 v_Color;

    void main() {
        gl_FragColor = vec4(v_Color, 1.0);
    }
`
