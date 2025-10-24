varying vec2 vUv;

uniform vec2 u_offset; // Смещение в мировых координатах
uniform float u_seed;
uniform float u_scale; // Масштаб шума

// 2D Random
float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123 * (u_seed + 1.0));
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}


void main() {
    // Рассчитываем мировые координаты для этого "пикселя"
    vec2 worldPos = u_offset + vUv * u_scale;

    // Вычисляем высоту ландшафта
    // Для простоты здесь используется только одна октава шума
    float height = noise(worldPos / 50.0); // Делим, чтобы сделать ландшафт более плавным

    // Преобразуем высоту в диапазон [0, 1] и записываем в красный канал цвета
    // Мы можем использовать другие каналы (g, b, a) для других данных, например, биома
    gl_FragColor = vec4(height, 0.0, 0.0, 1.0);
}