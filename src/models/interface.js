
import * as tf from '@tensorflow/tfjs';
import { utils } from '../utils.js';
import { viewport } from '../index.js';

export class ModelInterface {
    trainStep = 0;
    trainStepMax = 200;

    drag = { held: false, offsetStart: { x: 0, y: 0 }, mouseStart: { x: 0, y: 0 } };
    transform = {
        offset: { x: 0, y: 0 },
        zoom: 1
    };
    lastTransform = { ...this.transform };

    constructor(model, box, res) {
        this.model = model;
        this.box = box;
        this.res = res;

        this.trainEmbedding = model.getEmbedding(res, 0, 0, 1);
        this.viewEmbedding = model.getEmbedding(res, 0, 0, 1);
        this.image = createImage(res, res);
        this.image.loadPixels();

        let predImg = tf.tidy(() => this.model.predict(this.viewEmbedding).clipByValue(0, 1));
        this.setImage(predImg);
    }

    handleImage(img) {
        tf.dispose(this.targetTensor);
        this.targetTensor = tf.tidy(() => {
            return tf.browser.fromPixels({
                data: Uint8Array.from(img.pixels),
                width: img.width, height: img.height
            }, 3).div(255);
        });
        this.trainStep = 0;
    }

    mousePressed() {
        if (utils.mouseInRect(this.box)) {
            this.drag.held = true;
            this.drag.offsetStart = { ...this.transform.offset };
            this.drag.mouseStart = { x: viewport.mouseX, y: viewport.mouseY };
        }
    }

    mouseReleased() {
        this.drag.held = false;
    }

    mouseWheel(delta) {
        if (utils.mouseInRect(this.box)) {
            if (delta > 0) {
                this.transform.zoom /= 1.2;
            } else {
                this.transform.zoom *= 1.2;
            }
        }
    }

    setTransform(x, y, zoom) {
        this.transform = {
            offset: { x: x, y: y },
            zoom: zoom
        };
    }

    update(dt) {
        if (utils.mouseInRect(this.box) || this.drag.held) {
            utils.cursorStyle('move');
        }
        if (this.drag.held) {
            let ms = this.drag.mouseStart;
            let os = this.drag.offsetStart;
            let b = this.box, z = this.transform.zoom;
            let dx = (viewport.mouseX - ms.x) / b[2] / z;
            let dy = (viewport.mouseY - ms.y) / b[3] / z;
            this.transform.offset = { x: os.x + dx, y: os.y + dy };
        }

        let t = this.transform;
        let viewIsOrigin = t.offset.x === 0 && t.offset.y === 0 && t.zoom === 1;
        let _t = this.lastTransform;
        let sameView = t.offset.x === _t.offset.x && t.offset.y === _t.offset.y && t.zoom === _t.zoom;
        let didTrainStep = false;
        if (this.targetTensor && this.trainStep < this.trainStepMax) {
            // train step
            let x = this.trainEmbedding;
            let y = this.targetTensor;
            let predImg = this.model.trainStep(x, y);
            didTrainStep = true;
            if (viewIsOrigin) {
                // use image from training
                this.setImage(predImg);
            } else {
                tf.dispose(predImg);
            }
            this.trainStep++;
        }
        if (didTrainStep && !viewIsOrigin || !sameView) {
            // update view
            if (!sameView) {
                // update viewEmbedding
                tf.dispose(this.viewEmbedding);
                this.viewEmbedding = this.model.getEmbedding(this.res, t.offset.x, t.offset.y, t.zoom);
                this.lastTransform = { ...t };
            }
            let predImg = tf.tidy(() => this.model.predict(this.viewEmbedding).clipByValue(0, 1));
            this.setImage(predImg);
        }
    }

    async setImage(tensor) {
        let newImage = await tf.browser.toPixels(tensor);
        tf.dispose(tensor);
        copyPixels(newImage, this.image.pixels);
        this.image.updatePixels();
    }

    draw() {
        image(this.image, ...this.box);
        
        fill(0, 0, 255);
        let b = this.box;
        let bx = b[0], by = b[1], bw = b[2], bh = b[3];
        rect(bx, by + bh + 20, bw * min(this.trainStep / this.trainStepMax, 1), 20);
    }

    dispose() {
        tf.dispose(this);
    }
}

// https://forum.processing.org/two/discussion/10485/troubles-with-the-p5-image-pixels-array
let copyPixels = function (src) {
    const args = arguments.length;

    var sIdx = 0, dst = arguments[1], dIdx = 0,
        len = args == 3 ? ~~Math.abs(arguments[2]) : src.length;

    if (args > 3) {
        sIdx = ~~Math.abs(dst);
        dst = arguments[2];
        dIdx = ~~Math.abs(arguments[3]);
        len = args > 4 ? ~~Math.abs(arguments[4]) : len;
    }

    const sLen = src.length, dLen = dst.length,
        end = Math.min(len + sIdx, sLen);

    if (!sIdx && sLen <= len && sLen + dIdx <= dLen && ArrayBuffer.isView(dst))
        dst.set(src, dIdx);
    else
        for (var i = sIdx, j = dIdx; i < end & j < dLen; dst[j++] = src[i++]);

    return dst;
}
