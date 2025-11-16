uniform sampler2D uPreviousTexture;
uniform vec2 uDelta; // Размер одного пикселя (1/width, 1/height)
uniform vec4 uDrop;  // x, y, radius, strength

void main() {
    vec2 uv = gl_FragCoord.xy * uDelta;
    
    // Получаем значение высоты из предыдущего и текущего пикселя
    // r - текущая высота, g - предыдущая высота
    vec4 data = texture2D(uPreviousTexture, uv);
    
    // Соседи
    vec4 top    = texture2D(uPreviousTexture, uv + vec2(0.0, uDelta.y));
    vec4 bottom = texture2D(uPreviousTexture, uv - vec2(0.0, uDelta.y));
    vec4 left   = texture2D(uPreviousTexture, uv - vec2(uDelta.x, 0.0));
    vec4 right  = texture2D(uPreviousTexture, uv + vec2(uDelta.x, 0.0));
    
    // Простое уравнение волны (среднее соседей)
    float average = (top.r + bottom.r + left.r + right.r) * 0.25;
    
    // Новая высота: разница между средним и предыдущей высотой
    float newHeight = average * 2.0 - data.g;
    
    // Затухание (Damping)
    newHeight *= 0.985;
    
    // Добавление новой капли
    float dist = distance(uv, uDrop.xy);
    if (dist < uDrop.z) {
        // Плавное добавление капли с помощью cos
        newHeight += (cos(dist / uDrop.z * 3.14159) + 1.0) * uDrop.w;
    }

    gl_FragColor = vec4(newHeight, data.r, 0.0, 1.0); // Новая высота в 'r', старая в 'g'
}