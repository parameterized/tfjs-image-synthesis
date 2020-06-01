
import { MenuState } from './menu.js';
import { CPPNState } from './cppn.js';

export class StateManager {
    constructor() {
        this.states = {
            menu: new MenuState(),
            cppn: new CPPNState()
        };
        this.activeState = this.states.menu;

        // set up callbacks
        let cbs = ['mousePressed', 'keyPressed', 'update', 'draw', 'handleImage'];
        for (let v of cbs) {
            this[v] = (...args) => {
                let f = this.activeState[v];
                if (f) { f.call(this.activeState, ...args); }
            }
        }
    }
}
