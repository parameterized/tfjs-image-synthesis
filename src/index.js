
import './utils.js';
import { Viewport } from './viewport.js';
import { Uploader } from './uploader.js';
import { Generator } from './generator.js';

window.targetWidth = 1600;
window.targetHeight = 900;
export let viewport;

let fixedDt = 1 / 60;
let dtTimer = 0;

export let touchUsed = false;
export let touchIsPressed = false;
export let touchTimer = 1; // disable mouse if touch use in last 0.5s
export let ptouches = []; // touches before callback
export let touch = null; // set to what callback is referencing

export let imageRes = 64;
export let uploader, generator;

window.preload = function() {
    window.gfx = {
        frog: loadImage('gfx/biggan_frog.png')
    };
}

window.setup = function() {
    canvas = createCanvas(innerWidth, innerHeight);
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

    // nearest neighbor scaling when drawing
    let context = canvas.elt.getContext('2d');
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.msImageSmoothingEnabled = false;
    context.imageSmoothingEnabled = false;
    strokeJoin(ROUND);
    
    viewport = new Viewport(targetWidth, targetHeight);

    uploader = new Uploader();
    // add drop callbacks
    canvas.dragOver(() => uploader.dragOver());
    canvas.dragLeave(() => uploader.dragLeave());
    canvas.drop(file => uploader.drop(file), () => uploader.dragLeave());

    generator = new Generator(imageRes);
}

function pressed() {
    uploader.mousePressed();
}
function released() {
    
}

window.mousePressed = function(event) {
    event.preventDefault();
    if (touchTimer > 0.5) {
        pressed();
    }
}
window.touchStarted = function(event) {
    event.preventDefault();
    touchUsed = true;
    // first element in touches that isn't in ptouches
    touch = touches.filter(t => ptouches.findIndex(pt => pt.id === t.id) === -1)[0];
    touchIsPressed = true;
    if (touch) {
        mouseX = touch.x;
        mouseY = touch.y;
        viewport.updateMouse();
    }
    pressed();
    ptouches = [...touches];
    touch = null;
}

window.mouseReleased = function(event) {
    event.preventDefault();
    if (touchTimer > 0.5) {
        released();
    }
}
window.touchEnded = function(event) {
    event.preventDefault();
    // first element in ptouches that isn't in touches
    touch = ptouches.filter(pt => touches.findIndex(t => t.id === pt.id) === -1)[0];
    if (touches.length === 0) {
        touchIsPressed = false;
    }
    released();
    ptouches = [...touches];
    touch = null;
}

window.mouseDragged = function(event) {
    event.preventDefault();
}
window.touchMoved = function(event) {
    event.preventDefault();
}

window.keyPressed = function() {
    switch (keyCode) {
        case 82: // R
            if (uploader.scaledImage) {
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

function update() {
    document.body.style.cursor = 'default';
    let dt = min(1 / frameRate(), 1 / 10);
    dtTimer += dt;
    while (dtTimer > 0) {
        dtTimer -= fixedDt;
        fixedUpdate(fixedDt);
    }

    viewport.updateMouse();
}

function fixedUpdate(dt) {
    generator.update(dt);
}

window.draw = function() {
    update();
    noStroke();

    viewport.set();
    background('#EEF1EF');

    uploader.draw();
    generator.draw();

    uploader.drawOverlay();

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
