
import { targetWidth, targetHeight, stateManager as sm } from '../index.js';
import { UI } from '../ui.js';

export class MenuState {
    constructor() {
        this.ui = new UI();
        let c1 = color('#EEF1EF');
        let c2 = color('#A9B4C2');
        this.ui.addButton({
            text: 'CPPN', box: [160, 160, 200, 80],
            action: () => sm.switchState('cppn'),
            c1: c1, c2: c2
        });
    }

    mousePressed() {
        this.ui.mousePressed();
    }

    draw() {
        fill('#7D98A1');
        rect(0, 0, targetWidth, targetHeight);

        this.ui.draw();
    }
}
