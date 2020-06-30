
import * as tf from '@tensorflow/tfjs';
import { SineActivation } from './customLayers.js';

export class ImageModel {
    small = false;
    loss = tf.losses.meanSquaredError;

    load() {
        this.dispose();

        this.model = tf.sequential();
        let filtersPerLayer = this.small ? [64, 32] : [64, 64, 64, 32];

        let uniform = tf.initializers.randomUniform;
        let biasInit = uniform({ minval: -PI, maxval: PI });
        let limit = sqrt(6 / 2) * 15;
        this.model.add(tf.layers.conv2d({
            filters: filtersPerLayer[0], kernelSize: 1, biasInitializer: biasInit, inputShape: [null, null, 2],
            kernelInitializer: uniform({ minval: -limit, maxval: limit })
        }));
        this.model.add(new SineActivation());
        for (let i = 1; i < filtersPerLayer.length; i++) {
            this.model.add(tf.layers.conv2d({
                filters: filtersPerLayer[i], kernelSize: 1, biasInitializer: biasInit,
                kernelInitializer: 'heUniform'
            }));
            this.model.add(new SineActivation());
        }
        this.model.add(tf.layers.conv2d({
            filters: 3, kernelSize: 1, biasInitializer: biasInit,
            kernelInitializer: 'heUniform', activation: 'tanh'
        }));

        // build model
        tf.dispose(this.model.predict(tf.zeros([1, 1, 1, 2])));

        this.optimizer = tf.train.adam(0.01);
    }

    dispose() {
        tf.dispose([this.model, this.optimizer]);
    }

    getInput(res, x, y, zoom, subpixelRandomization) {
        let pixelSize = 2 / res / zoom;
        let maxCoord = 1 - pixelSize / 2;
        return tf.tidy(() => {
            let channels = [];
            for (let axis = 0; axis < 2; axis++) {
                let pts = tf.linspace(-maxCoord, maxCoord, res);
                if (!(x === 0 && y === 0 && zoom === 1)) {
                    pts = pts.div(zoom).add(axis === 0 ? x : y);
                }
                if (axis === 0) {
                    channels.push(pts.expandDims(0).tile([res, 1]));
                } else {
                    channels.push(pts.expandDims(1).tile([1, res]));
                }
            }
            let coords = tf.stack(channels, -1);
            if (subpixelRandomization) {
                coords = coords.add(tf.randomUniform(coords.shape, -pixelSize / 2, pixelSize / 2));
            }
            return coords;
        });
    }

    predict(x) {
        return tf.tidy(() => this.model.predict(x.expandDims(0)).squeeze());
    }

    trainStep(y) {
        let yPred;
        this.optimizer.minimize(() => {
            let x = this.getInput(y.shape[0], 0, 0, 1, true);
            yPred = tf.keep(this.predict(x));
            return this.loss(y, yPred);
        });
        return yPred;
    }
}
