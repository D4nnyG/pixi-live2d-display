import { ICubismModelData } from "./types";

export function unload(asset: ICubismModelData){
    for(const texture of asset.textures) texture.destroy(true);
    asset.textures.length = 0;

    for(const key in asset.sounds){
        for(const sound of asset.sounds[key]) sound.destroy();
        asset.sounds[key].length = 0;
        delete asset.sounds[key];
    }

    for(const key in asset.motions){
        asset.motions[key].length = 0;
        delete asset.motions[key];
    }

    if(asset.expressions) asset.expressions.length = 0;

    delete asset.moc;
    delete asset.textures;
    delete asset.motions;
    delete asset.physics;
    delete asset.pose;
    delete asset.expressions;
    delete asset.sounds;
    delete asset.settings;
    console.log(asset)
}