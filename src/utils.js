
import { viewport, touchTimer } from './index.js';

let utils = {
    mouseInRect(r_or_x, y, w, h) {
        let x = r_or_x;
        if (typeof (r_or_x) === 'object') {
            let r = r_or_x;
            if (r.length) {
                x = r[0]; y = r[1]; w = r[2]; h = r[3];
            } else {
                x = r.x; y = r.y; w = r.w; h = r.h;
            }
        }
        return (viewport.mouseX > x && viewport.mouseX < x + w
            && viewport.mouseY > y && viewport.mouseY < y + h);
    },
    cursorStyle(style) {
        if (touchTimer > 0.5) {
            document.body.style.cursor = style;
        }
    },
    setPointer() {
        utils.cursorStyle('pointer');
    },
    hash(x, y) {
        return abs(sin(x * 12.9898 + y * 4.1414) * 43758.5453) % 1;
    },
    pingPong(t) {
        t = abs(t);
        return t % 2 < 1 ? t % 1 : 1 - t % 1;
    },
    mod(n, m) {
        return ((n % m) + m) % m;
    },
    deltaAngle(a, b) {
        let d = b - a;
        return utils.mod(d + PI, TWO_PI) - PI;
    },
    lerpAngle(a, b, t) {
        let theta = b - a;
        if (theta > PI) {
            a += TWO_PI;
        } else if (theta < -PI) {
            a -= TWO_PI;
        }
        return lerp(a, b, t);
    }
};

let ease = {
    inQuad(t) { return t * t },
    outQuad(t) { return t * (2 - t) },
    inOutQuad(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t },
    inCubic(t) { return t * t * t },
    outCubic(t) { return (--t) * t * t + 1 },
    inOutCubic(t) { return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1 },
    inQuart(t) { return t * t * t * t },
    outQuart(t) { return 1 - (--t) * t * t * t },
    inOutQuart(t) { return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t },
    inQuint(t) { return t * t * t * t * t },
    outQuint(t) { return 1 + (--t) * t * t * t * t },
    inOutQuint(t) { return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t }
};

export { utils, ease };
