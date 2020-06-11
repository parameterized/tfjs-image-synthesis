
import * as tf from '@tensorflow/tfjs';

export class CPPNModel {
    embedFreqs = 6;
    embedChannels = 3;

    constructor(small) {
        this.embedPhase = tf.randomUniform([this.embedFreqs, 2, this.embedChannels]).mul(TWO_PI);

        this.model = tf.sequential();
        let filtersPerLayer = small ? [16] : [64, 64, 32];
        this.model.add(tf.layers.conv2d({
            filters: filtersPerLayer[0], kernelSize: 1, kernelInitializer: 'heNormal', activation: 'relu',
            inputShape: [null, null, this.embedFreqs * 2 * this.embedChannels * 2]
        }));
        for (let i = 1; i < filtersPerLayer.length; i++) {
            this.model.add(tf.layers.conv2d({ filters: filtersPerLayer[i], kernelSize: 1, kernelInitializer: 'heNormal', activation: 'relu' }));
        }
        this.model.add(tf.layers.conv2d({ filters: 3, kernelSize: 1, kernelInitializer: 'heNormal', activation: 'sigmoid' }));

        this.loss = tf.losses.meanSquaredError;
        this.optimizer = tf.train.adam(0.01);
    }

    getEmbedding(res, x, y, zoom) {
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
                        let x = pts.mul(PI * pow(2, freq));
                        let phase = this.embedPhase.slice([freq, axis, channel], [1, 1, 1]).flatten();
                        x = x.add(phase);
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
