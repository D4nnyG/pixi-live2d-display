// run this to tell git not to track this file
// git update-index --skip-worktree test/playground/index.ts

import { Application, Ticker } from 'pixi.js';
import { Live2DModel } from '../src';
import { Assets } from '@pixi/assets';
import { sound } from "@pixi/sound";

Live2DModel.registerTicker(Ticker);

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

async function main() {
    const app = new Application({
        view: canvas,
        width: 1280,
        height:720
    });
    const { renderer } = app;
    (window as any).app = app;
    (window as any).renderer = renderer;
    (window as any).sound = sound;
    (window as any).assets = Assets;

    Assets.load("./Haru/Haru.model3.json").then(resp => {
        const model = Live2DModel.fromAsset(resp);
        model.scale = {x:0.25, y:0.25};
        app.stage.addChild(model);
        globalThis.model = model;
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
