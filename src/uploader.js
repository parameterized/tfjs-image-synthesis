
import { utils } from './utils.js';
import { imageRes, stateManager as sm } from './index.js';

export class Uploader {
    constructor() {
        let cx = targetWidth / 4;
        let cy = targetHeight / 2;
        let w = 512, h = 512;
        this.imageBox = [cx - w / 2, cy - h / 2, w, h];
    }

    handleFile(file) {
        if (file.type === 'image' && sm.activeState !== sm.states.menu) {
            loadImage(file.data, img => this.handleImage(img));
        }
    }

    handleImage(img) {
        this.originalImage = img;
        this.scaledImage = img.get();
        this.scaledImage.resize(imageRes, imageRes);
        this.scaledImage.loadPixels();
        sm.handleImage();
    }

    dragOver() {
        this.dropHovering = true;
    }

    dragLeave() {
        this.dropHovering = false;
    }

    drop(file) {
        this.handleFile(file);
    }

    mousePressed() {
        if (utils.mouseInRect(this.imageBox)) {
            let input = createFileInput(file => {
                this.handleFile(file);
            });
            input.elt.accept = '.png,.jpg';
            input.elt.click();
            input.remove();
        }
    }

    draw() {
        let hovering = false
        if (utils.mouseInRect(this.imageBox)) {
            utils.setPointer();
            hovering = true;
        }

        if (this.scaledImage) {
            image(this.scaledImage, ...this.imageBox);
        } else {
            fill(200);
            rect(...this.imageBox);

            fill(140);
            let b = this.imageBox;
            let bx = b[0], by = b[1], bw = b[2], bh = b[3];
            push();
            translate(bx + bw / 2, by + bh / 2);
            if (hovering) { scale(1.2); }
            rect(-40, -10, 80, 20);
            rect(-10, -40, 20, 80);
            pop();

            textAlign(CENTER, TOP);
            textSize(36);
            text('Choose an image\nor drag & drop', bx + bw / 2, by + bh / 2 + 80);
        }
    }

    drawOverlay() {
        if (this.dropHovering) {
            fill(255, 96);
            rect(0, 0, targetWidth, targetHeight);
        }
    }
}
