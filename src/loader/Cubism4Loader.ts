import { ExtensionType, Texture, extensions } from "@pixi/core";
import { LoadAsset, Loader } from "@pixi/assets";
import { path } from "@pixi/utils";
import { Cubism4Spec } from "@/types/Cubism4Spec";

export interface IModelData {
    settings?: Cubism4Spec.ModelJSON
    moc?: ArrayBuffer;
    textures?: Texture[];
    motions?: {[motionName: string]: Cubism4Spec.Motion[]};
    physics?: Cubism4Spec.Physics;
    pose?: Cubism4Spec.Pose;
    expressions?: Cubism4Spec.Expressions[];
}

export class Cubism4Loader {
    static extension = ExtensionType.LoadParser;

    static test(url: string){
        return url.endsWith(".moc3");
    }

    static async load(url: string): Promise<ArrayBuffer> {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return arrayBuffer;
    }

    static testParse(asset: any): boolean{
        if(!asset.FileReferences) return false;
        return !!asset.FileReferences.Moc &&
            !!asset.FileReferences.Textures;
    }

    static async parse(asset: Cubism4Spec.ModelJSON, loadAsset: LoadAsset, loader: Loader){
        const modelData: IModelData = {
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
            for(const motionName in FR.Motions){
                modelData.motions[motionName] = []
                for(const motionIndex in FR.Motions[motionName]){
                    promises.push(
                        loader.load(
                            path.join(dir, FR.Motions[motionName][motionIndex].File)
                        ).then(motion => {
                            modelData.motions[motionName][motionIndex] = motion;
                    }));
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
                    modelData.expressions![expressionIndex] = expression;
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
    }

    static unload(asset: IModelData){
        delete asset.moc;
        delete asset.textures;
        delete asset.motions;
        delete asset.physics;
        delete asset.pose;
        delete asset.expressions;
    }
}