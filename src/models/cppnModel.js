
import * as tf from '@tensorflow/tfjs';
import { utils } from '../utils.js';

export class CPPNModel {
    embedFreqs = 6;
    embedChannels = 3;
    small = false;

    load() {
        tf.dispose([this.embedPhase, this.embedFrequency, this.model, this.optimizer]);

        let axes = 2;
        let embedShape = [this.embedFreqs, axes, this.embedChannels]; // +2 for sin/cos
        this.embedPhase = tf.randomUniform(embedShape);
        this.embedFrequency = tf.tidy(() => {
            let ef = tf.pow(2, tf.range(0, this.embedFreqs)).mul(PI);
            ef = ef.reshape([-1, 1, 1]).tile([1, 2, this.embedChannels]);
            return ef.add(tf.randomUniform(embedShape, 0, 0.5));
        });

        this.model = tf.sequential();
        let filtersPerLayer = this.small ? [16] : [64, 64, 32];
        this.model.add(tf.layers.conv2d({
            filters: filtersPerLayer[0], kernelSize: 1, kernelInitializer: 'heNormal', activation: 'relu',
            inputShape: [null, null, utils.prod(embedShape) * 2]
        }));
        for (let i = 1; i < filtersPerLayer.length; i++) {
            this.model.add(tf.layers.conv2d({ filters: filtersPerLayer[i], kernelSize: 1, kernelInitializer: 'heNormal', activation: 'relu' }));
        }
        this.model.add(tf.layers.conv2d({ filters: 3, kernelSize: 1, kernelInitializer: 'heNormal', activation: 'sigmoid' }));

        this.loss = tf.losses.meanSquaredError;
        this.optimizer = tf.train.adam(0.01);
    }

    getInput(res, x, y, zoom) {
        return tf.tidy(() => {
            let waves = [];
            for (let axis = 0; axis < 2; axis++) {
                let pts = tf.linspace(0, 1, res + 1).slice([0], [res]);
                if (!(x === 0 && y === 0 && zoom === 1)) {
                    let offset = axis === 0 ? x : y;
                    pts = pts.sub(0.5).div(zoom).add(0.5);
                    pts = pts.sub(offset);
                }
                for (let freq = 0; freq < this.embedFreqs; freq++) {
                    for (let channel = 0; channel < this.embedChannels; channel++) {
                        let phase = this.embedPhase.slice([freq, axis, channel], [1, 1, 1]).flatten();
                        let x = pts.add(phase);
                        let f = this.embedFrequency.slice([freq, axis, channel], [1, 1, 1]).flatten();
                        x = x.mul(f);
                        x = tf.stack([x.cos(), x.sin()], -1);
                        if (axis === 0) {
                            waves.push(x.expandDims(0).tile([res, 1, 1]));
                        } else {
                            waves.push(x.expandDims(1).tile([1, res, 1]));
                        }
                    }
                }
            }
            return tf.concat(waves, -1);
        });
    }

    predict(x) {
        return tf.tidy(() => this.model.predict(x.expandDims(0)).squeeze());
    }

    trainStep(x, y) {
        let predImg;
        this.optimizer.minimize(() => {
            let yPred = this.predict(x);
            predImg = tf.keep(yPred.clipByValue(0, 1));
            return this.loss(y, yPred);
        });
        return predImg;
    }
}
