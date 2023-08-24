import { ExtensionType } from "@pixi/core";
import { Loader, LoaderParserPriority, ResolvedAsset, loadTextures } from "@pixi/assets";
import { path } from "@pixi/utils";
import { Cubism2Spec } from "@/types/Cubism2Spec";
import { ICubism2ModelData } from "./types";
import { loadArrayBuffer as load } from "./loadArrayBuffer";
import { unload } from "./unload";

export const cubism2Load = {
    name:"loadCubism2",

    extension: {
        type:ExtensionType.LoadParser,
        priority: LoaderParserPriority.High
    },

    test(url:string): boolean {
        const ext = path.extname(url)
        return ext === ".moc" || ext === ".mtn";
    },

    load,

    testParse(asset: ResolvedAsset): boolean {
        if(!asset.model) return false;
        return path.extname(asset.model) === ".moc";
    },

    async parse(
        asset: Cubism2Spec.ModelJSON,
        loadAsset: ResolvedAsset,
        loader: Loader
    ): Promise<ICubism2ModelData>{
        const modelData: ICubism2ModelData = {
            textures: [],
        };
        // Image Bitmap fucks Cubism 2 for some reason
        const preferCreateImageBitmap = loadTextures.config.preferCreateImageBitmap;
        loadTextures.config.preferCreateImageBitmap = false;

        const promises: Promise<void>[] = [];
        modelData.settings = asset;
        // url required in settings for older models.
        //@ts-ignore
        asset.url = loadAsset.src;
        const dir = path.dirname(loadAsset.src);

        // Load moc
        promises.push(
            loader.load(
                path.join(dir, asset.model)
        ).then(moc => {
            modelData.moc = moc;
        }));

        // Load textures
        for(const textureIndex in asset.textures){
            promises.push(
                loader.load(
                    path.join(dir, asset.textures[textureIndex])
                ).then(texture => {
                    modelData.textures[textureIndex] = texture;
            }));
        }

        // Load Motions
        if(asset.motions){
            modelData.motions = {};
            modelData.sounds = {};
            for(const motionName in asset.motions){
                modelData.motions[motionName] = []
                modelData.sounds[motionName] = [];
                for(const motionIndex in asset.motions[motionName]){
                    promises.push(
                        loader.load(
                            path.join(dir, asset.motions[motionName][motionIndex].file)
                        ).then(motion => {
                            modelData.motions[motionName][motionIndex] = motion;
                    }));

                    if(asset.motions[motionName][motionIndex].sound){
                        promises.push(
                            loader.load(
                                path.join(dir, asset.motions[motionName][motionIndex].sound)
                            ).then(sound => {
                                modelData.sounds[motionName][motionIndex] = sound;
                        }));
                    }
                }
            }
        }

        // Load Physics
        if(asset.physics){
            promises.push(loader.load(path.join(dir, asset.physics)).then(physics => {
                modelData.physics = physics;
            }));
        }

        // Load Expressions
        if(asset.expressions){
            modelData.expressions = [];
            for(const expressionIndex in asset.expressions){
                promises.push(loader.load(path.join(dir, asset.expressions[expressionIndex].file)).then(expression => {
                    modelData.expressions![expressionIndex] = expression;
                }));
            }
        }

        // Load Pose
        if(asset.pose){
            promises.push(loader.load(path.join(dir, asset.pose)).then(pose => {
                modelData.pose = pose;
            }));
        }

        await Promise.all(promises);
        loadTextures.config.preferCreateImageBitmap = preferCreateImageBitmap;
        return modelData;
    },

    unload
}