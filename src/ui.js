
import { utils } from './utils.js';

export class UI {
    buttons = [];

    addButton(btnText, box, action, c1, c2) {
        c1 = c1 || color('#A9B4C2');
        c2 = c2 || color('#5E6572');
        let btn = { text: btnText, box: box, action: action, c1: c1, c2: c2 };
        this.buttons.push(btn);
        return btn;
    }

    mousePressed() {
        for (let v of this.buttons) {
            if (utils.mouseInRect(v.box) && v.action) {
                v.action();
            }
        }
    }

    draw() {
        textAlign(CENTER, CENTER);
        textSize(36);
        for (let v of this.buttons) {
            if (utils.mouseInRect(v.box)) {
                utils.setPointer();
                fill(v.c2);
            } else {
                fill(v.c1);
            }
            rect(...v.box);
            fill('#1C2321');
            let b = v.box;
            let bx = b[0], by = b[1], bw = b[2], bh = b[3];
            text(v.text, bx + bw / 2, by + bh / 2 + 3);
        }
    }
}
