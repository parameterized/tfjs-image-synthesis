
import { utils } from '../utils.js';
import { gfx, stateManager as sm, uploader, generator } from '../index.js';

export class CPPNState {
    constructor() {
        this.buttons = [
            {
                text: 'Back', box: [50, 50, 200, 80],
                action: () => sm.activeState = sm.states.menu
            }
        ];
    }

    mousePressed() {
        for (let v of this.buttons) {
            if (utils.mouseInRect(v.box) && v.action) {
                v.action();
            }
        }

        uploader.mousePressed();
    }

    keyPressed() {
        switch (keyCode) {
            case 27: // Esc
                sm.activeState = sm.states.menu;
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
        background('#EEF1EF');

        uploader.draw();
        generator.draw();

        textAlign(CENTER, CENTER);
        textSize(36);
        for (let v of this.buttons) {
            if (utils.mouseInRect(v.box)) {
                utils.setPointer();
                fill('#5E6572');
            } else {
                fill('#A9B4C2');
            }
            rect(...v.box);
            fill('#1C2321');
            let b = v.box;
            let bx = b[0], by = b[1], bw = b[2], bh = b[3];
            text(v.text, bx + bw / 2, by + bh / 2 + 3);
        }

        uploader.drawOverlay();
    }
}
