
import * as tf from '@tensorflow/tfjs';
import { imageRes, uploader } from './index.js';

let backendLoaded = false;
let forceCPU = false;
if (forceCPU) {
    tf.setBackend('cpu').then(() => backendLoaded = true);
} else {
    backendLoaded = true;
}

export class Generator {
    steps = 0;
    maxSteps = 200;
    embedFreqs = 6;
    embedChannels = 3;

    constructor() {
        let cx = targetWidth * 3 / 4;
        let cy = targetHeight / 2;
        let w = 512, h = 512;
        this.imageBox = [cx - w / 2, cy - h / 2, w, h];

        this.image = createImage(imageRes, imageRes);
        this.image.loadPixels();
    }

    loadTargetTensor() {
        if (!backendLoaded) { return; }

        this.targetImage = uploader.scaledImage;
        let img = this.targetImage;
        this.targetTensor = tf.tidy(() => {
            return tf.browser.fromPixels({
                data: Uint8Array.from(img.pixels),
                width: img.width, height: img.height
            }, 3).div(255);
        });

        this.startTraining();
    }

    startTraining() {
        this.loadNetwork();
        this.steps = 0;
        this.step();
    }

    loadNetwork() {
        this.embedPhase = tf.randomUniform([this.embedFreqs, 2, this.embedChannels]).mul(TWO_PI);
        this.embedding = this.getEmbedding();

        this.model = tf.sequential();
        this.model.add(tf.layers.conv2d({
            filters: 64, kernelSize: 1, kernelInitializer: 'heNormal', activation: 'relu',
            inputShape: [imageRes, imageRes, this.embedFreqs * 2 * this.embedChannels * 2]
        }));
        this.model.add(tf.layers.conv2d({ filters: 64, kernelSize: 1, kernelInitializer: 'heNormal', activation: 'relu' }));
        this.model.add(tf.layers.conv2d({ filters: 32, kernelSize: 1, kernelInitializer: 'heNormal', activation: 'relu' }));
        this.model.add(tf.layers.conv2d({ filters: 3, kernelSize: 1, kernelInitializer: 'heNormal', activation: 'sigmoid' }));

        this.optimizer = tf.train.adam(0.01);
    }

    getEmbedding() {
        return tf.tidy(() => {
            let waves = [];
            for (let freq = 0; freq < this.embedFreqs; freq++) {
                for (let axis = 0; axis < 2; axis++) {
                    for (let channel = 0; channel < this.embedChannels; channel++) {
                        let phase = this.embedPhase.slice([freq, axis, channel], [1, 1, 1]).flatten();
                        let x = tf.linspace(0, PI * pow(2, freq), imageRes + 1).slice([0], [imageRes]);
                        x = x.add(phase);
                        x = tf.stack([x.cos(), x.sin()], -1);
                        if (axis === 0) {
                            waves.push(x.expandDims(0).tile([imageRes, 1, 1]));
                        } else {
                            waves.push(x.expandDims(1).tile([1, imageRes, 1]));
                        }
                    }
                }
            }
            return tf.concat(waves, -1);
        });
    }

    zoomOut() {
        this.embedding = tf.tidy(() => {
            let waves = [];
            for (let freq = 0; freq < this.embedFreqs; freq++) {
                for (let axis = 0; axis < 2; axis++) {
                    for (let channel = 0; channel < this.embedChannels; channel++) {
                        let phase = this.embedPhase.slice([freq, axis, channel], [1, 1, 1]).flatten();
                        let x = tf.linspace(0, PI * pow(2, freq), imageRes + 1).slice([0], [imageRes]);
                        x = x.mul(3).sub(PI * pow(2, freq));
                        x = x.add(phase);
                        x = tf.stack([x.cos(), x.sin()], -1);
                        if (axis === 0) {
                            waves.push(x.expandDims(0).tile([imageRes, 1, 1]));
                        } else {
                            waves.push(x.expandDims(1).tile([1, imageRes, 1]));
                        }
                    }
                }
            }
            return tf.concat(waves, -1);
        });
        this.step();
    }

    update(dt) {
        if (backendLoaded && this.targetTensor
            && !this.generating && this.steps < this.maxSteps) {
            this.step();
        }
    }

    async step() {
        this.generating = true;

        let imageTensor;
        tf.tidy(() => {
            this.optimizer.minimize(() => {
                let predTensor = this.model.predict(this.embedding.expandDims(0)).squeeze();
                imageTensor = tf.keep(predTensor.clipByValue(0, 1));
                return tf.losses.meanSquaredError(this.targetTensor, predTensor);
            });
        });
        
        let newImage = await tf.browser.toPixels(imageTensor);
        copyPixels(newImage, this.image.pixels);
        this.image.updatePixels();

        this.steps++;
        this.generating = false;
    }

    draw() {
        if (this.steps === 0) {
            fill(200);
            rect(...this.imageBox);
        } else {
            image(this.image, ...this.imageBox);
        }

        fill(0, 0, 255);
        let b = this.imageBox;
        let bx = b[0], by = b[1], bw = b[2], bh = b[3];
        rect(bx, by + bh + 20, bw * min(this.steps / this.maxSteps, 1), 20);
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
