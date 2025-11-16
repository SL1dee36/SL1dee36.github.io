uniform float uTime;
uniform float uWaveAmplitude;
uniform vec2 uWaveFrequency;
uniform float uWaveSpeed;
uniform sampler2D uRippleTexture;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec4 vScreenPosition;

// Функция для создания процедурных волн (Gerstner-подобные)
vec3 gerstnerWave(vec2 position, vec2 direction, float steepness, float wavelength) {
    float k = 2.0 * 3.14159 / wavelength;
    float c = sqrt(9.8 / k);
    float f = k * (dot(direction, position) - c * uTime * uWaveSpeed * 10.0);
    
    float a = steepness / k;

    return vec3(
        direction.x * a * cos(f),
        a * sin(f),
        direction.y * a * cos(f)
    );
}


void main() {
    vUv = uv;
    vec3 pos = position;

    // --- Интерактивная рябь из FBO ---
    float ripple = texture2D(uRippleTexture, vUv).r * 0.5; // Берем только красный канал
    pos.z += ripple;

    // --- Процедурные волны ---
    vec3 wave1 = gerstnerWave(position.xy, vec2(1.0, 0.5), uWaveAmplitude, uWaveFrequency.x);
    vec3 wave2 = gerstnerWave(position.xy, vec2(0.8, 0.2), uWaveAmplitude * 0.5, uWaveFrequency.y * 2.0);
    pos.z += wave1.y + wave2.y; // Смещаем по Z, т.к. плоскость воды у нас XY

    // --- Вычисление нормали ---
    // Это упрощенный метод, использующий производные волновых функций
    float dx = wave1.x + wave2.x;
    float dy = wave1.z + wave2.z;
    vec3 tangent = normalize(vec3(1.0, 0.0, dx));
    vec3 bitangent = normalize(vec3(0.0, 1.0, dy));
    vNormal = normalize(cross(bitangent, tangent));
    
    // --- Позиции ---
    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = modelPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * modelPosition;
    vScreenPosition = gl_Position;
}