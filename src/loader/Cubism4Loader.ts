import { ExtensionType, Texture, extensions } from "@pixi/core";
import { Loader, LoaderParserPriority, ResolvedAsset, loadTextures } from "@pixi/assets";
import { path } from "@pixi/utils";
import { Cubism4Spec } from "@/types/Cubism4Spec";
import { Cubism2Spec } from "@/types/Cubism2Spec";

export interface ICubism4ModelData {
    settings?: Cubism4Spec.ModelJSON
    moc?: ArrayBuffer;
    textures?: Texture[];
    motions?: Record<string, Cubism4Spec.Motion[]>;
    physics?: Cubism4Spec.Physics;
    pose?: Cubism4Spec.Pose;
    expressions?: Cubism4Spec.Expressions[];
}

export interface ICubism2ModelData {
    settings?: Cubism2Spec.ModelJSON
    moc?: ArrayBuffer;
    textures?: Texture[];
    motions?: Record<string, ArrayBuffer[]>
    physics?: Cubism4Spec.Physics;
    pose?: Cubism4Spec.Pose;
    expressions?: Cubism2Spec.ExpressionJSON[];
}

export type ICubismModelData = ICubism2ModelData | ICubism4ModelData;

async function loadArrayBuffer(url: string): Promise<ArrayBuffer>{
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
}

export const cubism4Load = {
    name:"loadCubism4",

    extension: {
        type:ExtensionType.LoadParser,
        priority: LoaderParserPriority.Normal
    },

    test(url:string): boolean {
        return path.extname(url) === ".moc3"
    },

    load: loadArrayBuffer,

    testParse(asset: ResolvedAsset): boolean {
        if(!asset.FileReferences) return false;
        return !!asset.FileReferences.Moc &&
            !!asset.FileReferences.Textures;
    },

    async parse(
        asset: Cubism4Spec.ModelJSON,
        loadAsset: ResolvedAsset,
        loader: Loader
        ): Promise<ICubismModelData> {
            const modelData: ICubismModelData = {
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
        },

        unload(asset: ICubism4ModelData){
            delete asset.moc;
            delete asset.textures;
            delete asset.motions;
            delete asset.physics;
            delete asset.pose;
            delete asset.expressions;
        }
}

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

    load: loadArrayBuffer,

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
            for(const motionName in asset.motions){
                modelData.motions[motionName] = []
                for(const motionIndex in asset.motions[motionName]){
                    promises.push(
                        loader.load(
                            path.join(dir, asset.motions[motionName][motionIndex].file)
                        ).then(motion => {
                            modelData.motions[motionName][motionIndex] = motion;
                    }));
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
    }
}

// loadTextures.config.preferWorkers = false;
// loadTextures.config.preferCreateImageBitmap = false;