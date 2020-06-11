
import { ease } from '../utils.js';
import { targetWidth } from '../index.js';

import { MenuState } from './menu.js';
import { CPPNState } from './cppn.js';

export class StateManager {
    switchT = 1;

    constructor() {
        this.states = {
            menu: new MenuState(),
            cppn: new CPPNState()
        };
        this.activeState = this.states.menu;

        // pass callbacks to active state
        let cbs = [
            'mousePressed', 'mouseReleased', 'mouseWheel', 'keyPressed',
            'dragOver', 'dragLeave', 'drop'];
        for (let id of cbs) {
            this[id] = (...args) => this.stateCallback(id, ...args);
        }
    }

    stateCallback(id, ...args) {
        let f = this.activeState[id];
        if (f && this.switchT >= 1) {
            f.call(this.activeState, ...args);
        }
    }

    switchState(id) {
        this.lastState = this.activeState;
        this.activeState = this.states[id];
        this.switchT = 0;
    }

    update(dt) {
        this.switchT += dt;
        this.stateCallback('update', dt);
    }

    draw() {
        if (this.switchT < 1) {
            let t = ease.inOutCubic(this.switchT);
            for (let [i, v] of Object.entries([this.lastState, this.activeState])) {
                push();
                if (this.activeState === this.states.menu) {
                    translate(i === '0' ? t * targetWidth : (-1 + t) * targetWidth, 0);
                } else {
                    translate(i === '0' ? -t * targetWidth : targetWidth * (1 - t), 0);
                }
                v.draw.call(v);
                pop();
            }
        } else {
            this.stateCallback('draw');
        }
    }
}
