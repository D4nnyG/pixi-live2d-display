import { ExtensionType } from "@pixi/core";
import { Loader, LoaderParserPriority, ResolvedAsset } from "@pixi/assets";
import { path } from "@pixi/utils";
import { Cubism4Spec } from "@/types/Cubism4Spec";
import { ICubism4ModelData } from "./types";
import { loadArrayBuffer as load } from "./loadArrayBuffer";
import { unload } from "./unload";

export const cubism4Load = {
    name:"loadCubism4",

    extension: {
        type:ExtensionType.LoadParser,
        priority: LoaderParserPriority.Normal
    },

    test(url:string): boolean {
        return path.extname(url) === ".moc3"
    },

    load,

    testParse(asset: ResolvedAsset): boolean {
        if(!asset.FileReferences) return false;
        return !!asset.FileReferences.Moc &&
            !!asset.FileReferences.Textures;
    },

    async parse(
        asset: Cubism4Spec.ModelJSON,
        loadAsset: ResolvedAsset,
        loader: Loader
        ): Promise<ICubism4ModelData> {
            const modelData: ICubism4ModelData = {
                textures: [],
            };
            const FR = asset.FileReferences;
            const promises: Promise<void>[] = [];
            modelData.settings = asset;
            // url required in settings for older models.
            asset.url = loadAsset.src;
            const dir = path.dirname(loadAsset.src);
    
            // Load moc
            promises.push(loader.load(
                path.join(dir, FR.Moc)
            ).then(moc => {
                modelData.moc = moc;
            }));
    
            // Load textures
            for(const textureIndex in FR.Textures){
                promises.push(
                    loader.load(
                        path.join(dir, FR.Textures[textureIndex])
                    ).then(texture => {
                        modelData.textures[textureIndex] = texture;
                }));
            }
    
    
            // Load Motions
            if(FR.Motions){
                modelData.motions = {};
                modelData.sounds = {};
                for(const motionName in FR.Motions){
                    modelData.motions[motionName] = []
                    modelData.sounds[motionName] = []
                    for(const motionIndex in FR.Motions[motionName]){
                        const data = FR.Motions[motionName][motionIndex]
                        promises.push(
                            loader.load(
                                path.join(dir, data.File)
                            ).then(motion => {
                                modelData.motions[motionName][motionIndex] = motion;
                        }));
                        if(data.Sound){
                            promises.push(
                                loader.load(
                                    path.join(dir, data.Sound)
                                ).then(sound => {
                                    modelData.sounds[motionName][motionIndex] = sound;
                            }));
                        }
                    }
                }
            }
    
            // Load Physics
            if(FR.Physics){
                promises.push(loader.load(path.join(dir, FR.Physics)).then(physics => {
                    modelData.physics = physics;
                }));
            }
    
            // Load Expressions
            if(FR.Expressions){
                modelData.expressions = [];
                for(const expressionIndex in FR.Expressions){
                    promises.push(loader.load(path.join(dir, FR.Expressions[expressionIndex].File)).then(expression => {
                        modelData.expressions[expressionIndex] = expression;
                    }));
                }
            }
    
            // Load Pose
            if(FR.Pose){
                promises.push(loader.load(path.join(dir, FR.Pose)).then(pose => {
                    modelData.pose = pose;
                }));
            }
    
            await Promise.all(promises);
            return modelData;
        },

        unload
}