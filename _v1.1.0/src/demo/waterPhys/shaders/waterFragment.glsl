uniform vec3 uWaterColor;
uniform vec3 uSpecularColor;
uniform float uShininess;
uniform vec3 uLightDirection;
uniform samplerCube uSkybox;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec4 vScreenPosition;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);

    // --- Отражения (Reflection) ---
    vec3 reflectDir = reflect(-viewDirection, normal);
    vec4 reflectionColor = textureCube(uSkybox, reflectDir);

    // --- Эффект Френеля (Fresnel) ---
    // Определяет, насколько поверхность отражает или пропускает свет в зависимости от угла обзора
    float fresnel = 0.02 + 0.98 * pow(1.0 - dot(viewDirection, normal), 5.0);
    fresnel = clamp(fresnel, 0.0, 1.0);

    // --- Блики (Specular - Blinn-Phong) ---
    vec3 halfwayDir = normalize(uLightDirection + viewDirection);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), uShininess);
    vec3 specular = uSpecularColor * spec;

    // --- Финальный цвет ---
    vec3 finalColor = mix(uWaterColor, reflectionColor.rgb, fresnel);
    finalColor += specular;
    
    gl_FragColor = vec4(finalColor, 0.8); // 0.8 - прозрачность
}