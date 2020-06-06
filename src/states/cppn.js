
import { utils } from '../utils.js';
import { targetWidth, targetHeight, viewport, gfx,
    stateManager as sm, uploader, generator } from '../index.js';
import { UI } from '../ui.js';

export class CPPNState {
    drag = { held: false, offsetStart: { x: 0, y: 0 }, mouseStart: { x: 0, y: 0 } };

    constructor() {
        this.ui = new UI();
        this.ui.addButton({
            text: 'Back', box: [50, 50, 200, 80],
            action: () => sm.switchState('menu')
        });

        // pos for generator image - todo: redundancy
        let cx = targetWidth * 3 / 4;
        let cy = targetHeight / 2;
        let w = 512, h = 512;
        let x = cx - w / 2;
        let y = cy - h / 2;

        let bw = (w - 20) / 3;
        this.ui.addButton({
            text: 'Zoom In', box: [x, y - 70, bw, 60],
            action: () => this.zoom(1.5),
            textSize: 28
        });
        this.ui.addButton({
            text: 'Zoom Out', box: [x + bw + 10, y - 70, bw, 60],
            action: () => this.zoom(1 / 1.5),
            textSize: 28
        });
        this.ui.addButton({
            text: 'Reset View', box: [x + (bw + 10) * 2, y - 70, bw, 60],
            action: () => generator.setTransform(0, 0, 1),
            textSize: 28
        });

        bw = 340;
        this.ui.addButton({
            getText: () => `Use ${generator.smallModel ? 'Large' : 'Small'} Model`,
            box: [cx - bw / 2, y + w + 60, bw, 80],
            action: () => {
                generator.smallModel = !generator.smallModel;
                if (generator.targetTensor) {
                    generator.startTraining();
                }
            }
        });

        this.ui.addButton({
            text: 'Retrain', box: [targetWidth / 2 - 100, targetHeight / 2 - 40, 200, 80],
            action: () => {
                if (generator.targetTensor) {
                    generator.startTraining();
                }
            }
        });
    }

    mousePressed() {
        this.ui.mousePressed();
        uploader.mousePressed();

        if (utils.mouseInRect(generator.imageBox)) {
            this.drag.held = true;
            this.drag.offsetStart = {...generator.offset};
            this.drag.mouseStart = { x: viewport.mouseX, y: viewport.mouseY };
        }
    }

    mouseReleased() {
        this.drag.held = false;
    }

    mouseWheel(delta) {
        if (utils.mouseInRect(generator.imageBox)) {
            if (delta > 0) {
                this.zoom(1 / 1.2);
            } else {
                this.zoom(1.2);
            }
        }
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
        }
    }

    handleImage() {
        generator.loadTargetTensor();
    }

    zoom(m) {
        let o = generator.offset;
        let z = generator.zoom;
        generator.setTransform(o.x, o.y, z * m);
    }

    update(dt) {
        if (utils.mouseInRect(generator.imageBox) || this.drag.held) {
            utils.cursorStyle('move');
        }
        if (this.drag.held) {
            let ms = this.drag.mouseStart;
            let os = this.drag.offsetStart;
            let b = generator.imageBox, z = generator.zoom;
            let dx = (viewport.mouseX - ms.x) / b[2] / z;
            let dy = (viewport.mouseY - ms.y) / b[3] / z;
            generator.setTransform(os.x + dx, os.y + dy, z);
        }
        
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
