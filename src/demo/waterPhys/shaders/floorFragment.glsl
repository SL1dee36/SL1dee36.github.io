// shaders/floorFragment.glsl - финальная версия

uniform bool uCausticsEnabled;
uniform float uCausticsStrength;
uniform sampler2D uCausticsTexture;
uniform sampler2D uRippleTexture;
uniform vec2 uPoolSize;
uniform float uTime;
uniform vec3 uLightDirection;
uniform sampler2D uTileTexture;
uniform float uTiling;

varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
    // 1. Сначала просто берем цвет из текстуры плитки.
    // Это будет базовый цвет для всех поверхностей (и внутренних, и внешних).
    vec3 baseColor = texture2D(uTileTexture, vUv * uTiling).rgb;
    
    // 2. Проверяем, включены ли каустики в GUI.
    if (uCausticsEnabled) {
        
        // 3. *** КЛЮЧЕВОЕ ИЗМЕНЕНИЕ ***
        // Определяем, находится ли текущий пиксель ВНУТРИ бассейна.
        // Для этого он должен быть:
        //    a) Ниже уровня воды (y < 0).
        //    b) В пределах горизонтальных границ бассейна (по X и Z).
        // Мы добавляем небольшое значение (эпсилон) 0.01, чтобы избежать артефактов на самых границах.
        
        bool isInsidePool = vWorldPosition.y < -0.01 && 
                            abs(vWorldPosition.x) < (uPoolSize.x / 2.0 + 0.01) && 
                            abs(vWorldPosition.z) < (uPoolSize.y / 2.0 + 0.01);
        
        // 4. Если все условия выполнены, рассчитываем и добавляем каустику.
        if (isInsidePool) {
            vec2 rippleUv = vec2(
                (vWorldPosition.x + uPoolSize.x / 2.0) / uPoolSize.x,
                (vWorldPosition.z + uPoolSize.y / 2.0) / uPoolSize.y
            );

            float ripple = texture2D(uRippleTexture, rippleUv).r;
            
            vec2 causticsUv = vUv * 2.0;
            causticsUv.x += uTime * 0.03;
            causticsUv.y += uTime * 0.02;
            
            vec2 distortion = vec2(ripple) * normalize(uLightDirection.xz) * 0.2;
            causticsUv += distortion;

            float caustics = texture2D(uCausticsTexture, causticsUv).r;
            
            // Добавляем эффект каустики поверх текстуры плитки
            baseColor += caustics * uCausticsStrength;
        }
    }

    gl_FragColor = vec4(baseColor, 1.0);
}