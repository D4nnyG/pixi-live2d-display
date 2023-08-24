import { InternalModel, ModelSettings } from '@/cubism-common';
import { JSONObject } from './types/helpers';

/**
 * Represents a Cubism version.
 */
export interface Live2DRuntime {
    /**
     * The version number. Higher version takes priority when matching the runtime.
     */
    version: number;

    /**
     * Checks if the source belongs to this runtime.
     * @param source - Either a settings JSON object or a ModelSettings instance.
     * @return True if the source belongs to this runtime.
     */
    test(source: any): boolean;

    // TODO: remove
    ready(): Promise<void>;

    /**
     * Checks if the data is a valid moc to create the core model.
     * @param modelData - The moc content.
     * @return True if the data is valid.
     */
    isValidMoc(modelData: ArrayBuffer): boolean;

    /**
     * Creates a ModelSettings.
     * @param json - The settings JSON object.
     * @return Created ModelSettings.
     */
    createModelSettings(json: JSONObject): ModelSettings;

    /**
     * Creates a core model.
     * @param data - Content of the moc file.
     * @return Created core model.
     */
    createCoreModel(data: ArrayBuffer): any;

    /**
     * Creates an InternalModel.
     * @param coreModel - Core model that *must* belong to this runtime.
     * @param settings - ModelSettings of this model.
     * @param options - Options that will be passed to the InternalModel's constructor.
     * @return Created InternalModel.
     */
    createInternalModel(coreModel: any, settings: ModelSettings): InternalModel;

    /**
     * Creates a pose.
     * @param coreModel - Core model that *must* belong to this runtime.
     * @param data - Content of the pose file.
     * @return Created pose.
     */
    createPose(coreModel: any, data: any): any;

    /**
     * Creates a physics.
     * @param coreModel - Core model that *must* belong to this runtime.
     * @param data - Content of the physics file.
     * @return Created physics.
     */
    createPhysics(coreModel: any, data: any): any;
}

export class RuntimeManager {
    /**
     * All registered runtimes, sorted by versions in descending order.
     */
    static runtimes: Live2DRuntime[] = [];

    /**
     * Registers a Live2DRuntime.
     */
    static registerRuntime(runtime: Live2DRuntime) {
        this.runtimes.push(runtime);

        // higher version as higher priority
        this.runtimes.sort((a, b) => b.version - a.version);
    }

    /**
     * Finds a runtime that matches given source.
     * @param source - Either a settings JSON object or a ModelSettings instance.
     * @return The Live2DRuntime, or undefined if not found.
     */
    static findRuntime(source: any): Live2DRuntime | undefined {
        for (const runtime of this.runtimes) {
            if (runtime.test(source)) {
                return runtime;
            }
        }
    }
}