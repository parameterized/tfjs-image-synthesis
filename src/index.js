
import './utils.js';
import { Viewport } from './viewport.js';
import { Generator } from './generator.js';
import * as tf from '@tensorflow/tfjs';

window.targetWidth = 1600;
window.targetHeight = 900;

let bg1, bg2, bgCol;
let targetImage;
let generator;

let imageRes = 64;

window.preload = function() {
    window.gfx = {
        frog: loadImage('gfx/biggan_frog.png')
    };
}

window.setup = function() {
    window.canvas = createCanvas(innerWidth, innerHeight);
    canvas.parent('sketch');

    // prevent default for right click, double click, and tab
    canvas.elt.addEventListener('contextmenu', e => {
        e.preventDefault();
    });
    canvas.elt.addEventListener('mousedown', e => {
        if (e.detail > 1) {
            e.preventDefault();
        }
    });
    document.addEventListener('keydown', e => {
        if (e.keyCode === 9) { // Tab
            e.preventDefault();
        }
    });

    // nearest neighbor scaling
    let context = canvas.elt.getContext('2d');
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.msImageSmoothingEnabled = false;
    context.imageSmoothingEnabled = false;

    // add drop callbacks
    canvas.dragOver(dragOver);
    canvas.dragLeave(dragLeave);
    canvas.drop(drop, dragLeave);

    strokeJoin(ROUND);

    window.viewport = new Viewport(targetWidth, targetHeight);
    generator = new Generator(imageRes);

    bg1 = color('#EEF1EF');
    bg2 = color('#A9B4C2');
    bgCol = bg1;
}

function dragOver() {
    bgCol = bg2;
}
function dragLeave() {
    bgCol = bg1;
}
function drop(file) {
    loadImage(file.data, img => {
        targetImage = img;
        img.resize(imageRes, imageRes);
        img.loadPixels();
        generator.setTargetImage(img);
    });
}

window.keyPressed = function() {
    switch (keyCode) {
        case 82: // R
            if (targetImage) {
                generator.setTargetImage(targetImage);
            }
            break;
        case 70: // F
            targetImage = gfx.frog.get();
            targetImage.resize(imageRes, imageRes);
            targetImage.loadPixels();
            generator.setTargetImage(targetImage);
            break;
        case 90: // Z
            generator.embedding = tf.tidy(() => {
                let waves = [];
                for (let freq = 0; freq < generator.embedFreqs; freq++) {
                    for (let axis = 0; axis < 2; axis++) {
                        for (let channel = 0; channel < generator.embedChannels; channel++) {
                            let phase = generator.embedPhase.slice([freq, axis, channel], [1, 1, 1]).flatten();
                            let x = tf.linspace(0, PI * pow(2, freq), generator.imageRes + 1).slice([0], [generator.imageRes]);
                            x = x.mul(3).sub(PI * pow(2, freq));
                            x = x.add(phase);
                            x = tf.stack([x.cos(), x.sin()], -1);
                            if (axis === 0) {
                                waves.push(x.expandDims(0).tile([generator.imageRes, 1, 1]));
                            } else {
                                waves.push(x.expandDims(1).tile([1, generator.imageRes, 1]));
                            }
                        }
                    }
                }
                return tf.concat(waves, -1);
            });
            generator.step();
            break;
    }
}

function update() {
    let dt = min(1 / frameRate(), 1 / 10);
    generator.update(dt);
}

window.draw = function() {
    update();
    noStroke();

    viewport.set();
    background(bgCol);

    if (targetImage) {
        image(targetImage, 64, 64, 640, 640);
    }
    image(generator.image, targetWidth - (640 + 64), 64, 640, 640);

    fill(0, 0, 255);
    rect(targetWidth - (640 + 64), 720, 640 * generator.steps / generator.maxSteps, 20);

    // cover top/bottom off-screen graphics
    fill('#1C2321');
    let v = viewport;
    rect(v.fullX, v.fullY, v.fullW, 0 - v.fullY);
    rect(v.fullX, v.targetHeight, v.fullW, v.fullY + v.fullH - v.targetHeight);
    // cover sides
    rect(v.fullX, v.fullY, 0 - v.fullX, v.fullH);
    rect(v.targetWidth, v.fullY, v.fullX + v.fullW - v.targetWidth, v.fullH);

    viewport.reset();
}

window.windowResized = function () {
    resizeCanvas(windowWidth, windowHeight);
    if (viewport) {
        viewport.updateSize();
    }
}
