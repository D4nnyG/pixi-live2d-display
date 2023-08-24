import { Cubism2Spec } from "@/types/Cubism2Spec";
import { Cubism4Spec } from "@/types/Cubism4Spec";
import { Texture } from "@pixi/core";
import { Sound } from "@pixi/sound";

export interface ICubism4ModelData {
    settings?: Cubism4Spec.ModelJSON
    moc?: ArrayBuffer;
    textures?: Texture[];
    motions?: Record<string, Cubism4Spec.Motion[]>;
    physics?: Cubism4Spec.Physics;
    pose?: Cubism4Spec.Pose;
    expressions?: Cubism4Spec.Expressions[];
    sounds?: Record<string, Sound[]>;
}

export interface ICubism2ModelData {
    settings?: Cubism2Spec.ModelJSON
    moc?: ArrayBuffer;
    textures?: Texture[];
    motions?: Record<string, ArrayBuffer[]>
    physics?: Cubism2Spec.PhysicsJSON;
    pose?: Cubism2Spec.PoseJSON;
    expressions?: Cubism2Spec.ExpressionJSON[];
    sounds?: Record<string, Sound[]>;
}

export type ICubismModelData = ICubism2ModelData | ICubism4ModelData;