
import { targetWidth, targetHeight, gfx } from '../index.js';
import { Page } from './page.js';
import { CPPNModel } from '../models/cppnModel.js';
import { ModelInterface } from './components/modelInterface.js';
import { Uploader } from './components/uploader.js';

export class CPPN extends Page {
    constructor() {
        super('CPPN with sinusoidal\nposition encoding');

        this.model = new CPPNModel();
        this.modelInterface = this.addComponent(new ModelInterface({
            model: this.model
        }));
        
        this.uploader = this.addComponent(new Uploader({
            handleImage: (img) => this.modelInterface.handleImage(img)
        }));
        
        let miBox = this.modelInterface.box;
        let bw = 340;
        this.ui.addButton({
            getText: () => `Use ${this.model.small ? 'Large' : 'Small'} Model`,
            box: [miBox[0] + miBox[2] / 2 - bw / 2, miBox[1] + miBox[3] + 60, bw, 80],
            action: () => {
                this.model.small = !this.model.small;
                this.modelInterface.reload();
            }
        });

        this.ui.addButton({
            text: 'Retrain', box: [targetWidth / 2 - 100, targetHeight / 2 - 40, 200, 80],
            action: () => this.modelInterface.reload()
        });
    }

    keyPressed() {
        if (keyCode === 70) { // F
            this.uploader.handleImage(gfx.frog);
        }
        super.keyPressed();
    }
}
