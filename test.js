// Run with: node test.js
const assert = require('node:assert');
const fs = require('node:fs');
const vm = require('node:vm');

// Load script.js with a stub document so only the dithering function runs
const ctx = { document: { addEventListener() {} } };
vm.runInNewContext(fs.readFileSync(__dirname + '/script.js', 'utf8'), ctx);
const dither = ctx.applyAtkinsonDithering;

// Reference: the straightforward original implementation, kept to catch offset/rounding mistakes
function reference(data, width, height) {
    const g = new Uint8ClampedArray(width * height);
    for (let i = 0; i < g.length; i++) g[i] = Math.round(data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114);
    const out = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const old = g[y * width + x];
            const v = old < 128 ? 0 : 255;
            const err = (old - v) / 8;
            const spread = (nx, ny) => { if (nx >= 0 && nx < width && ny < height) g[ny * width + nx] += err; };
            spread(x + 1, y); spread(x + 2, y);
            spread(x - 1, y + 1); spread(x, y + 1); spread(x + 1, y + 1);
            spread(x, y + 2);
            out.push(v);
        }
    }
    return out;
}

const rgba = (w, h, f) => {
    const d = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) d.set([...f(i), 255], i * 4);
    return d;
};

// 1. Random colour image matches the reference, and output is opaque pure black/white
let seed = 1;
const rand = () => (seed = (seed * 16807) % 2147483647) % 256;
const w = 37, h = 23;
const img = rgba(w, h, () => [rand(), rand(), rand()]);
const out = dither(img, w, h);
const expected = reference(img, w, h);
for (let i = 0; i < w * h; i++) {
    assert.ok(out[i * 4] === 0 || out[i * 4] === 255, `pixel ${i} not black/white`);
    assert.strictEqual(out[i * 4], expected[i], `pixel ${i} differs from reference`);
    assert.strictEqual(out[i * 4 + 1], out[i * 4]);
    assert.strictEqual(out[i * 4 + 2], out[i * 4]);
    assert.strictEqual(out[i * 4 + 3], 255, `pixel ${i} not opaque`);
}

// 2. Flat mid-grey comes out roughly half white
const grey = dither(rgba(16, 16, () => [128, 128, 128]), 16, 16);
let white = 0;
for (let i = 0; i < 256; i++) if (grey[i * 4] === 255) white++;
assert.ok(white > 256 * 0.35 && white < 256 * 0.65, `mid-grey gave ${white}/256 white`);

console.log('ok');
