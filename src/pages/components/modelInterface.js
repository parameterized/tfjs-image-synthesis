
import * as tf from '@tensorflow/tfjs';
import { utils } from '../../utils.js';
import { targetWidth, targetHeight, viewport } from '../../index.js';
import { UI } from '../../ui.js';

export class ModelInterface {
    trainStep = 0;
    trainStepMax = 200;

    drag = { held: false, offsetStart: { x: 0, y: 0 }, mouseStart: { x: 0, y: 0 } };
    transform = {
        offset: { x: 0, y: 0 },
        zoom: 1
    };
    lastTransform = { ...this.transform };

    constructor(args) {
        // model, [box, res]
        this.model = args.model;
        this.box = args.box || utils.getBoxFromCenter(targetWidth * 3 / 4, targetHeight / 2, 512, 512);
        this.res = args.res || 64;

        this.model.load();
        this.trainInput = this.model.getInput(this.res, 0, 0, 1);
        this.viewInput = this.model.getInput(this.res, 0, 0, 1);
        this.image = createImage(this.res, this.res);
        this.image.loadPixels();
        this.updateView();

        this.ui = new UI();
        let [x, y, w, h] = this.box;
        let bw = (w - 20) / 3;
        this.ui.addButton({
            text: 'Zoom In', box: [x, y - 70, bw, 60],
            action: () => this.transform.zoom *= 1.5,
            textSize: 28
        });
        this.ui.addButton({
            text: 'Zoom Out', box: [x + bw + 10, y - 70, bw, 60],
            action: () => this.transform.zoom /= 1.5,
            textSize: 28
        });
        this.ui.addButton({
            text: 'Reset View', box: [x + (bw + 10) * 2, y - 70, bw, 60],
            action: () => this.setTransform(0, 0, 1),
            textSize: 28
        });
    }

    handleImage(img) {
        tf.dispose(this.targetTensor);
        this.targetTensor = tf.tidy(() => {
            return tf.browser.fromPixels({
                data: Uint8Array.from(img.pixels),
                width: img.width, height: img.height
            }, 3).div(255);
        });
        if (this.trainStep === 0) {
            this.setTransform(0, 0, 1);
        } else {
            this.reload();
        }
    }

    async setImage(tensor) {
        let newImage = await tf.browser.toPixels(tensor);
        tf.dispose(tensor);
        utils.copyPixels(newImage, this.image.pixels);
        this.image.updatePixels();
    }

    reload() {
        this.model.load();
        this.trainStep = 0;
        this.setTransform(0, 0, 1);
        this.trainInput = this.model.getInput(this.res, 0, 0, 1);
        this.viewInput = this.model.getInput(this.res, 0, 0, 1);
        this.updateView();
    }

    mousePressed() {
        this.ui.mousePressed();
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
            let x = this.trainInput;
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
            this.updateView();
        }
    }

    updateView() {
        let t = this.transform;
        let _t = this.lastTransform;
        let sameView = t.offset.x === _t.offset.x && t.offset.y === _t.offset.y && t.zoom === _t.zoom;

        if (!sameView) {
            // update viewInput
            tf.dispose(this.viewInput);
            this.viewInput = this.model.getInput(this.res, t.offset.x, t.offset.y, t.zoom);
            this.lastTransform = { ...t };
        }
        let predImg = tf.tidy(() => this.model.predict(this.viewInput).clipByValue(0, 1));
        this.setImage(predImg);
    }

    draw() {
        image(this.image, ...this.box);

        fill(0, 0, 255);
        let b = this.box;
        let bx = b[0], by = b[1], bw = b[2], bh = b[3];
        rect(bx, by + bh + 20, bw * min(this.trainStep / this.trainStepMax, 1), 20);

        this.ui.draw();
    }
}
