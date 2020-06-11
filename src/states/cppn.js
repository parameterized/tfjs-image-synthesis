
import { targetWidth, targetHeight, gfx, stateManager as sm } from '../index.js';
import { UI } from '../ui.js';
import { Uploader } from '../uploader.js';
import { ModelInterface } from '../models/interface.js';
import { CPPNModel } from '../models/cppnModel.js';

export class CPPNState {
    res = 64;

    constructor() {
        let cx = targetWidth / 4;
        let cy = targetHeight / 2;
        let w = 512, h = 512;
        let box = [cx - w / 2, cy - h / 2, w, h]
        this.uploader = new Uploader(box, this.res, img => {
            this.reloadModelInterface();
        });

        this.useSmallModel = false;
        let model = new CPPNModel(this.useSmallModel);
        cx = targetWidth * 3 / 4;
        cy = targetHeight / 2;
        w = 512, h = 512;
        let x = cx - w / 2;
        let y = cy - h / 2;
        box = [cx - w / 2, cy - h / 2, w, h]
        this.modelInterface = new ModelInterface(model, box, this.res);

        this.ui = new UI();
        this.ui.addText({
            text: 'CPPN with sinusoidal\nposition encoding',
            x: targetWidth / 2, y: 60
        });
        this.ui.addButton({
            text: 'Back', box: [50, 50, 200, 80],
            action: () => sm.switchState('menu')
        });

        let bw = (w - 20) / 3;
        this.ui.addButton({
            text: 'Zoom In', box: [x, y - 70, bw, 60],
            action: () => this.modelInterface.transform.zoom *= 1.5,
            textSize: 28
        });
        this.ui.addButton({
            text: 'Zoom Out', box: [x + bw + 10, y - 70, bw, 60],
            action: () => this.modelInterface.transform.zoom /= 1.5,
            textSize: 28
        });
        this.ui.addButton({
            text: 'Reset View', box: [x + (bw + 10) * 2, y - 70, bw, 60],
            action: () => this.modelInterface.setTransform(0, 0, 1),
            textSize: 28
        });

        bw = 340;
        this.ui.addButton({
            getText: () => `Use ${this.useSmallModel ? 'Large' : 'Small'} Model`,
            box: [cx - bw / 2, y + w + 60, bw, 80],
            action: () => {
                this.useSmallModel = !this.useSmallModel;
                this.reloadModelInterface();
            }
        });

        this.ui.addButton({
            text: 'Retrain', box: [targetWidth / 2 - 100, targetHeight / 2 - 40, 200, 80],
            action: () => this.reloadModelInterface()
        });

        // pass callbacks to uploader
        let cbs = ['dragOver', 'dragLeave', 'drop'];
        for (let id of cbs) {
            this[id] = (...args) => this.uploader[id](...args);
        }

        // pass callbacks to model interface
        cbs = ['mouseReleased', 'mouseWheel', 'update'];
        for (let id of cbs) {
            this[id] = (...args) => this.modelInterface[id](...args);
        }
    }

    reloadModelInterface() {
        this.modelInterface.dispose();
        let model = new CPPNModel(this.useSmallModel);
        let box = [...this.modelInterface.box];
        this.modelInterface = new ModelInterface(model, box, this.res);
        if (this.uploader.scaledImage) {
            this.modelInterface.handleImage(this.uploader.scaledImage);
        }
    }

    mousePressed() {
        this.ui.mousePressed();
        this.uploader.mousePressed();
        this.modelInterface.mousePressed();
    }

    keyPressed() {
        switch (keyCode) {
            case 27: // Esc
                sm.switchState('menu');
                break;
            case 82: // R
                this.reloadModelInterface();
                break;
            case 70: // F
                this.uploader.handleImage(gfx.frog);
                break;
        }
    }

    draw() {
        fill('#EEF1EF');
        rect(0, 0, targetWidth, targetHeight);

        this.uploader.draw();
        this.modelInterface.draw();
        this.ui.draw();

        this.uploader.drawOverlay();
    }
}
