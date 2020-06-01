
import { utils } from '../utils.js';
import { stateManager as sm } from '../index.js';

export class MenuState {
    constructor() {
        this.buttons = [
            { 
                text: 'CPPN', box: [160, 160, 200, 80],
                action: () => sm.activeState = sm.states.cppn
            }
        ];
    }

    mousePressed() {
        for (let v of this.buttons) {
            if (utils.mouseInRect(v.box) && v.action) {
                v.action();
            }
        }
    }

    draw() {
        background('#7D98A1');

        textAlign(CENTER, CENTER);
        textSize(36);
        for (let v of this.buttons) {
            if (utils.mouseInRect(v.box)) {
                utils.setPointer();
                fill('#A9B4C2');
            } else {
                fill('#EEF1EF');
            }
            rect(...v.box);
            fill('#1C2321');
            let b = v.box;
            let bx = b[0], by = b[1], bw = b[2], bh = b[3];
            text(v.text, bx + bw / 2, by + bh / 2 + 3);
        }
    }
}
