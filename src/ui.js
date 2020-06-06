
import { utils } from './utils.js';

export class UI {
    buttons = [];

    addButton(btn) {
        // (text/getText), box, action, [c1, c2, textSize]
        btn.c1 = btn.c1 || color('#A9B4C2');
        btn.c2 = btn.c2 || color('#7D858E');
        btn.textSize = btn.textSize || 36;
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
            textSize(v.textSize);
            let t = v.text || v.getText();
            text(t, bx + bw / 2, by + bh / 2 + 3);
        }
    }
}
