
import { pageManager as pm } from '../index.js';
import { Page } from './page.js';

export class MenuPage extends Page {
    constructor() {
        super('TFJS Experiments', true);
        let c1 = color('#EEF1EF');
        let c2 = color('#A9B4C2');
        let bw = 250;
        this.ui.addButton({
            text: 'Image', box: [160, 160, bw, 80],
            action: () => pm.switchPage('image'),
            c1: c1, c2: c2
        });
    }
}
