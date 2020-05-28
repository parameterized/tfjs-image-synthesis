
import './utils.js';
import { Viewport } from './viewport.js';
import { Generator } from './generator.js';

window.targetWidth = 1600;
window.targetHeight = 900;

let bg1, bg2, bgCol;
let targetImage;
let generator;

let imageRes = 64;

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
    if (keyCode === 82 && targetImage) { // R
        generator.setTargetImage(targetImage)
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
