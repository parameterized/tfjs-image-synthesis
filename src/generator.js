
import * as tf from '@tensorflow/tfjs';

export class Generator {
    targetTensor = null;
    generating = false;
    numFreqs = 2;
    steps = 0;
    maxSteps = 200;

    constructor(imageRes) {
        this.imageRes = imageRes;
        this.image = createImage(imageRes, imageRes);
        this.image.loadPixels();
    }

    setTargetImage(targetImage) {
        this.targetTensor = tf.tidy(() => {
            return tf.browser.fromPixels({
                data: Uint8Array.from(targetImage.pixels),
                width: targetImage.width, height: targetImage.height
            }, 3).div(255);
        });

        this.baseColor = tf.randomUniform([1, 1, 3]).variable();
        // [frequency, axis, channel]
        this.phase = tf.randomUniform([this.numFreqs, 2, 3]).mul(TWO_PI).variable();
        this.amplitude = tf.randomUniform([this.numFreqs, 2, 3]).variable();

        this.optimizer = tf.train.adam(0.05);
        this.steps = 0;
        this.step();
    }

    update(dt) {
        if (this.targetTensor && !this.generating && this.steps < this.maxSteps) {
            this.step();
        }
    }

    async step() {
        this.generating = true;

        let imageTensor;
        tf.tidy(() => {
            this.optimizer.minimize(() => {
                let baseColor = this.baseColor.tile([this.imageRes, this.imageRes, 1]);
                let waves = [baseColor];
                for (let freq = 0; freq < this.numFreqs; freq++) {
                    for (let axis = 0; axis < 2; axis++) {
                        let allChannels = [];
                        for (let channel = 0; channel < 3; channel++) {
                            let phase = this.phase.slice([freq, axis, channel], [1, 1, 1]).flatten();
                            let amplitude = this.amplitude.slice([freq, axis, channel], [1, 1, 1]).flatten();
                            let x = tf.linspace(0, PI * pow(2, freq), this.imageRes);
                            x = x.add(phase).cos().mul(amplitude);
                            if (axis === 0) {
                                allChannels.push(x.expandDims(0).tile([this.imageRes, 1]));
                            } else {
                                allChannels.push(x.expandDims(1).tile([1, this.imageRes]));
                            }
                        }
                        waves.push(tf.stack(allChannels, -1));
                    }
                }
                let predTensor = tf.stack(waves).sum(0);
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
