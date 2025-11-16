class PerlinNoise {
    constructor(size, seed) {
        this.size = size;
        this.seed = seed || Math.random();
        this.p = [];
        for (let i = 0; i < 2 * size; i++) {
            this.p[i] = i;
        }
        this.shuffle();
    }

    shuffle() {
        let n = this.p.length;
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
        }
    }

    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }


    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    noise(x, y, z = 0) {
        const X = Math.floor(x) & (this.size - 1);
        const Y = Math.floor(y) & (this.size - 1);
        const Z = Math.floor(z) & (this.size - 1);

        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        const zf = z - Math.floor(z);

        const n000 = this.grad(this.p[X + this.p[Y + this.p[Z]]] , xf    , yf   , zf    );
        const n001 = this.grad(this.p[X + this.p[Y + this.p[Z+1]]], xf    , yf   , zf -1 );
        const n010 = this.grad(this.p[X + this.p[Y+1+ this.p[Z]]], xf    , yf-1  , zf    );
        const n011 = this.grad(this.p[X + this.p[Y+1+ this.p[Z+1]]], xf   , yf-1  , zf -1 );
        const n100 = this.grad(this.p[X+1 + this.p[Y + this.p[Z]]], xf-1  , yf   , zf    );
        const n101 = this.grad(this.p[X+1 + this.p[Y + this.p[Z+1]]], xf-1  , yf   , zf -1 );
        const n110 = this.grad(this.p[X+1 + this.p[Y+1 +this.p[Z]]], xf-1  , yf-1  , zf    );
        const n111 = this.grad(this.p[X+1 + this.p[Y+1+this.p[Z+1]]], xf-1  , yf-1  , zf -1 );

        const x0 = this.lerp(this.fade(xf), n000, n100);
        const x1 = this.lerp(this.fade(xf), n010, n110);

        const y0 = this.lerp(this.fade(xf), n001, n101);
        const y1 = this.lerp(this.fade(xf), n011, n111);

        const zx = this.lerp(this.fade(yf), x0, x1)
        const zy = this.lerp(this.fade(yf), y0, y1);
        return this.lerp(this.fade(zf), zx, zy)
    }

    normalizedNoise(x, y, z) {
        return (this.noise(x,y,z) + 1) / 2;
    }
}