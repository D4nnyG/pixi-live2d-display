// run this to tell git not to track this file
// git update-index --skip-worktree test/playground/index.ts

import { Application, Ticker } from 'pixi.js';
import { Live2DModel } from '../src';
import { Assets } from '@pixi/assets';

Live2DModel.registerTicker(Ticker);

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const modelURL = 'https://cdn.jsdelivr.net/gh/Eikanya/Live2d-model/Live2D/Senko_Normals/senko.model3.json';

async function main() {
    const app = new Application({
        view: canvas,
        width: 1280,
        height:720
    });
    (window as any).app = app;

    Assets.load("./Haru/Haru.model3.json").then(resp => {
        const model = Live2DModel.fromAsset(resp);
        model.scale = {x:0.25, y:0.25};
        app.stage.addChild(model);
    });

    // const model = await Live2DModel.from(modelURL);
    // model.scale = {x:0.25, y:0.25}

    // app.stage.addChild(model);
}

main().then();

function checkbox(name: string, onChange: (checked: boolean) => void) {
    const id = name.replace(/\W/g, '').toLowerCase();

    document.getElementById('control')!.innerHTML += `
<p>
  <input type="checkbox" id="${id}">
  <label for="${id}">${name}</label>
</p>`;

    const checkbox = document.getElementById(id) as HTMLInputElement;

    checkbox.addEventListener('change', (ev) => {
        onChange(checkbox.checked);
    });

    onChange(checkbox.checked);
}
