
import { targetWidth, targetHeight, gfx, stateManager as sm, uploader, generator } from '../index.js';
import { UI } from '../ui.js';

export class CPPNState {
    constructor() {
        this.ui = new UI();
        this.ui.addButton('Back', [50, 50, 200, 80], () => sm.switchState('menu'));
    }

    mousePressed() {
        this.ui.mousePressed();
        uploader.mousePressed();
    }

    keyPressed() {
        switch (keyCode) {
            case 27: // Esc
                sm.switchState('menu');
                break;
            case 82: // R
                if (generator.targetTensor) {
                    generator.startTraining();
                }
                break;
            case 70: // F
                uploader.handleImage(gfx.frog);
                break;
            case 90: // Z
                generator.zoomOut();
                break;
        }
    }

    handleImage() {
        generator.loadTargetTensor();
        generator.startTraining();
    }

    update(dt) {
        generator.update(dt);
    }

    draw() {
        fill('#EEF1EF');
        rect(0, 0, targetWidth, targetHeight);

        uploader.draw();
        generator.draw();
        this.ui.draw();

        uploader.drawOverlay();
    }
}
