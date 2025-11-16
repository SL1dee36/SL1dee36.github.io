// lib/perlin.js
// By Ken Perlin
export const noise = (function() {
    // ... (вставьте код шума Перлина отсюда: https://github.com/josephg/noisejs/blob/master/perlin.js)
    // ВАЖНО: скопируйте содержимое файла perlin.js по ссылке
    // И в конце файла добавьте:
    // export const { seed, perlin2, perlin3 } = noise;
    // Или используйте этот упрощенный вариант:
    var PERLIN_YWRAPB = 4;
    var PERLIN_YWRAP = 1 << PERLIN_YWRAPB;
    var PERLIN_ZWRAPB = 8;
    var PERLIN_ZWRAP = 1 << PERLIN_ZWRAPB;
    var PERLIN_SIZE = 4095;
    var perlin_octaves = 4;
    var perlin_amp_falloff = 0.5;
    var scaled_cosine = function(i) {
        return 0.5 * (1.0 - Math.cos(i * Math.PI));
    };
    var p;
    return {
        seed: function(seed) {
            p = new Uint8Array(PERLIN_SIZE + 1);
            var i = 0;
            var j;
            var k;
            var S = new Uint16Array(256);
            for (i = 0; i < 256; i++)
                S[i] = i;
            var t;
            for (i = 0; i < 256; i++) {
                j = (seed + i) % 256;
                t = S[i];
                S[i] = S[j];
                S[j] = t;
            }
            i = 0;
            j = 0;
            for (k = 0; k < PERLIN_SIZE + 1; k++) {
                i = (i + 1) % 256;
                j = (j + S[i]) % 256;
                t = S[i];
                S[i] = S[j];
                S[j] = t;
                p[k] = S[(S[i] + S[j]) % 256];
            }
        },
        noise: function(x, y, z) {
            y = y || 0;
            z = z || 0;
            if (perlin_octaves === 1) {
                return this.perlin(x, y, z);
            }
            var total = 0;
            var frequency = 1;
            var amplitude = 1;
            var maxValue = 0;
            for (var i = 0; i < perlin_octaves; i++) {
                total += this.perlin(x * frequency, y * frequency, z * frequency) * amplitude;
                maxValue += amplitude;
                amplitude *= perlin_amp_falloff;
                frequency *= 2;
            }
            return total / maxValue;
        },
        perlin: function(x, y, z) {
            var xi = Math.floor(x) & PERLIN_SIZE;
            var yi = Math.floor(y) & PERLIN_SIZE;
            var zi = Math.floor(z) & PERLIN_SIZE;
            var xf = x - Math.floor(x);
            var yf = y - Math.floor(y);
            var zf = z - Math.floor(z);
            var rxf, ryf;
            var r = 0;
            var ampl = 0.5;
            var n1, n2, n3;
            var u = scaled_cosine(xf);
            var v = scaled_cosine(yf);
            var w = scaled_cosine(zf);
            var A = p[xi] + yi;
            var AA = p[A] + zi;
            var AB = p[A + 1] + zi;
            var B = p[xi + 1] + yi;
            var BA = p[B] + zi;
            var BB = p[B + 1] + zi;
            n1 = p[AA];
            n2 = p[BA];
            n3 = p[AB];
            var n4 = p[BB];
            var n5 = p[AA + 1];
            var n6 = p[BA + 1];
            var n7 = p[AB + 1];
            var n8 = p[BB + 1];
            var x1 = this.lerp(this.grad(n1, xf, yf, zf), this.grad(n2, xf - 1, yf, zf), u);
            var x2 = this.lerp(this.grad(n3, xf, yf - 1, zf), this.grad(n4, xf - 1, yf - 1, zf), u);
            var y1 = this.lerp(x1, x2, v);
            x1 = this.lerp(this.grad(n5, xf, yf, zf - 1), this.grad(n6, xf - 1, yf, zf - 1), u);
            x2 = this.lerp(this.grad(n7, xf, yf - 1, zf - 1), this.grad(n8, xf - 1, yf - 1, zf - 1), u);
            var y2 = this.lerp(x1, x2, v);
            return (this.lerp(y1, y2, w) + 1) / 2;
        },
        grad: function(hash, x, y, z) {
            var h = hash & 15;
            var u = h < 8 ? x : y;
            var v = h < 4 ? y : h === 12 || h === 14 ? x : z;
            return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        },
        lerp: function(a, b, x) {
            return a + x * (b - a);
        }
    }
})();