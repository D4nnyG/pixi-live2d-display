import { config } from '@/config';
import { ExpressionManager } from '@/cubism-common/ExpressionManager';
import { ModelSettings } from '@/cubism-common/ModelSettings';
import { MotionPriority, MotionState } from '@/cubism-common/MotionState';
import { logger } from '@/utils';
import { EventEmitter } from '@pixi/utils';
import { JSONObject, Mutable } from '../types/helpers';
import { IMediaInstance, PlayOptions, Sound } from '@pixi/sound';
import { WebAudioMedia } from '@pixi/sound/lib/webaudio';

export interface MotionManagerOptions {
    /**
     * How to preload the motions.
     * @default {@link MotionPreloadStrategy.NONE}
     */
    motionPreload?: MotionPreloadStrategy;

    /**
     * Specifies the idle motion group.
     * @default "idle" in Cubism 2 and "Idle" in Cubism 4.
     */
    idleMotionGroup?: string;
}

/**
 * Indicates how the motions will be preloaded.
 */
export enum MotionPreloadStrategy {
    /** Preload all the motions. */
    ALL = 'ALL',

    /** Preload only the idle motions. */
    IDLE = 'IDLE',

    /** No preload. */
    NONE = 'NONE',
}

export type SpeakOptions = PlayOptions & {expression?: number | string};

/**
 * Handles the motion playback.
 * @emits {@link MotionManagerEvents}
 */
export abstract class MotionManager<Motion = any, MotionSpec = any> extends EventEmitter {
    /**
     * Tag for logging.
     */
    tag: string;

    /**
     * Motion definitions copied from ModelSettings.
     */
    abstract readonly definitions: Partial<Record<string, MotionSpec[]>>;

    /**
     * Motion groups with particular internal usages. Currently there's only the `idle` field,
     * which specifies the actual name of the idle motion group, so the idle motions
     * can be correctly found from the settings JSON of various Cubism versions.
     */
    abstract readonly groups: { idle: string };

    /**
     * Indicates the content type of the motion files, varies in different Cubism versions.
     * This will be used as `xhr.responseType`.
     */
    abstract readonly motionDataType: 'json' | 'arraybuffer';

    /**expressionManager
     * Can be undefined if the settings defines no expression.
     */
    abstract expressionManager?: ExpressionManager;

    /**
     * The ModelSettings reference.
     */
    readonly settings: ModelSettings;

    /**
     * The Motions. The structure is the same as {@link definitions}, initially each group contains
     * an empty array, which means all motions will be `undefined`. When a Motion has been loaded,
     * it'll fill the place in which it should be; when it fails to load, the place will be filled
     * with `null`.
     */
    motionGroups: Partial<Record<string, (Motion | undefined | null)[]>> = {};

    /**
     * Maintains the state of this MotionManager.
     */
    state = new MotionState();

    /**
     * Flags there's a motion playing.
     */
    private _motionActive = false;

    public get motionActive(){
        return this._motionActive;
    }

    /**
     * Flags the instances has been destroyed.
     */
    destroyed = false;

    /**
     * Speak flags
     */
    private _playingSound = false;
    private _currentSound: Sound;
    private _currentAnalyser: AnalyserNode;

    public get playingSound(){
        return this._playingSound;
    }

    public get currentSound(){
        return this._currentSound;
    }

    public get currentAnalyser(){
        return this._currentAnalyser;
    }

    protected constructor(settings: ModelSettings, options?: MotionManagerOptions) {
        super();
        this.settings = settings;
        this.tag = `MotionManager(${settings.name})`;
        this.state.tag = this.tag;
    }

    /**
     * Should be called in the constructor of derived class.
     */
    protected init(options?: MotionManagerOptions) {
        if (options?.idleMotionGroup) {
            this.groups.idle = options.idleMotionGroup;
        }

        this.setupMotions(options);
        this.stopAllMotions();
    }

    /**
     * Sets up motions from the definitions, and preloads them according to the preload strategy.
     */
    protected setupMotions(options?: MotionManagerOptions): void {
        for (const group of Object.keys(this.definitions)) {
            // init with the same structure of definitions
            this.motionGroups[group] = [];
        }

        // preload motions

        let groups;

        switch (options?.motionPreload) {
            case MotionPreloadStrategy.NONE:
                return;

            case MotionPreloadStrategy.ALL:
                groups = Object.keys(this.definitions);
                break;

            case MotionPreloadStrategy.IDLE:
            default:
                groups = [this.groups.idle];
                break;
        }

        for (const group of groups) {
            if (this.definitions[group]) {
                for (let i = 0; i < this.definitions[group]!.length; i++) {
                    this.loadMotion(group, i).then();
                }
            }
        }
    }

    /**
     * Loads a Motion in a motion group. Errors in this method will not be thrown,
     * but be emitted with a "motionLoadError" event.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @return Promise that resolves with the Motion, or with undefined if it can't be loaded.
     * @emits {@link MotionManagerEvents.motionLoaded}
     * @emits {@link MotionManagerEvents.motionLoadError}
     */
    async loadMotion(group: string, index: number): Promise<Motion | undefined> {
        if (!this.definitions[group]?.[index]) {
            logger.warn(this.tag, `Undefined motion at "${group}"[${index}]`);
            return undefined;
        }

        if (this.motionGroups[group][index] === null) {
            logger.warn(this.tag, `Motion at "${group}"[${index}] failed to load.`);
            return undefined;
        }

        if (this.motionGroups[group][index]) {
            return this.motionGroups[group][index];
        }
        return undefined;
    }

    /**
     * Lip sync a sound.
     * @param sound The sound to lip sync
     * @param options Sound options
     * @param expression Epression to use while speaking
     */
    speak(sound: Sound, options: SpeakOptions = {}){
        if (!config.sound) return;

        this._currentSound = sound;
        this._currentAnalyser = (sound.media as WebAudioMedia).nodes.analyser;

        if (this.state.shouldOverrideExpression()) {
            this.expressionManager && this.expressionManager.resetExpression();
        }
        if (options.expression && this.expressionManager){
            this.expressionManager.setExpression(options.expression)
        }

        const passedComplete = options?.complete;
        const complete = (s: Sound) => {
            if(passedComplete) passedComplete(s);
            this._playingSound = false;
            this._currentSound = undefined;
            this._currentAnalyser = undefined;
            options.expression && this.expressionManager && this.expressionManager.resetExpression()
        };
        options.complete = complete;

        this._playingSound = true;
        return sound.play(options);
    }

    /**
     * Starts a motion as given priority.
     * @param group - The motion group.
     * @param index - Index in the motion group.
     * @param priority - The priority to be applied.
     * @param sound - The audio url to file or base64 content 
     * @param volume - Volume of the sound (0-1) /*new in 1.0.4*
     * @param expression - In case you want to mix up a expression while playing sound (bind with Model.expression())
     * @return Promise that resolves with true if the motion is successfully started, with false otherwise.
     */
    async startMotion(group: string, index: number, priority = MotionPriority.NORMAL, sound?: Sound, speakOptions: SpeakOptions = {}): Promise<boolean> {
        // Does not start a new motion if audio is still playing
        if (this.playingSound) return false;

        if (!this.state.reserve(group, index, priority)) return false;

        const definition = this.definitions[group]?.[index];

        if (!definition) return false;

        const motion = await this.loadMotion(group, index);

        let soundInstance: IMediaInstance;
        if (config.sound){
            if(sound){
                soundInstance = await this.speak(sound, speakOptions)
                priority = MotionPriority.FORCE
            } else if(this._sounds?.[group]?.[index]){
                soundInstance = await this.speak(this._sounds[group][index], speakOptions)
                priority = MotionPriority.FORCE
            }
        }

        if (!this.state.start(motion, group, index, priority)) {
            if (soundInstance) {
                soundInstance.stop();
                soundInstance.destroy();
            }
            return false;
        }

        if (this.state.shouldOverrideExpression()) {
            this.expressionManager && this.expressionManager.resetExpression();
        }

        logger.log(this.tag, 'Start motion:', this.getMotionName(definition));

        this.emit('motionStart', group, index, soundInstance, sound);
        
        if (speakOptions.expression && this.expressionManager){
            this.expressionManager.setExpression(speakOptions.expression)
        }

        this._motionActive = true;

        this._startMotion(motion!);

        return true;
    }

    /**
     * Starts a random Motion as given priority.
     * @param group - The motion group.
     * @param priority - The priority to be applied.
     * @param sound - The wav url file or base64 content
     * @return Promise that resolves with true if the motion is successfully started, with false otherwise.
     */
    async startRandomMotion(group: string, priority?: MotionPriority, sound?: Sound): Promise<boolean> {
        const groupDefs = this.definitions[group];

        if (groupDefs?.length) {
            const availableIndices = [];

            for (let i = 0; i < groupDefs!.length; i++) {
                if (this.motionGroups[group]![i] !== null && !this.state.isActive(group, i)) {
                    availableIndices.push(i);
                }
            }

            if (availableIndices.length) {
                const index = Math.floor(Math.random() * availableIndices.length);

                return this.startMotion(group, availableIndices[index]!, priority, sound);
            }
        }

        return false;
    }

    /**
     * Stop current audio playback and lipsync
     */
    stopSpeaking(): void {
        if(this.currentAnalyser){
            this._currentAnalyser = undefined;
        }
    }

    /**
     * Stops all playing motions as well as the sound.
     */
    stopAllMotions(): void {
        this._stopAllMotions();

        this.state.reset();

        this.stopSpeaking()
    }

    /**
     * Updates parameters of the core model.
     * @param model - The core model.
     * @param now - Current time in milliseconds.
     * @return True if the parameters have been actually updated.
     */
    update(model: object, now: DOMHighResTimeStamp): boolean {
        if (this.isFinished()) {
            if (this.motionActive) {
                this._motionActive = false;
                this.emit('motionFinish');
            }

            if (this.state.shouldOverrideExpression()) {
                this.expressionManager?.restoreExpression();
            }

            this.state.complete();

            if (this.state.shouldRequestIdleMotion()) {
                // noinspection JSIgnoredPromiseFromCall
                this.startRandomMotion(this.groups.idle, MotionPriority.IDLE);
            }
        }

        return this.updateParameters(model, now);
    }

    /**
     * Move the mouth
     * 
     */
     mouthSync(): number {
        if(this.currentAnalyser){
            let pcmData = new Float32Array(this.currentAnalyser.fftSize);
            let sumSquares = 0.0;
            this.currentAnalyser.getFloatTimeDomainData(pcmData);

            for(const amplitude of pcmData){
                sumSquares += amplitude*amplitude;
            }
            return parseFloat(Math.sqrt((sumSquares / pcmData.length) * 20).toFixed(1));
        } else {
            return 0;
        }
    }

    private _sounds: Record<string, Sound[]> = {};

    registerSound(sound: Sound, group: string, index: number){
        if(!this._sounds[group]) this._sounds[group] = [];
        this._sounds[group][index] = sound;
    }

    /**
     * Destroys the instance.
     * @emits {@link MotionManagerEvents.destroy}
     */
    destroy() {
        this.destroyed = true;
        this.emit('destroy');

        this.stopSpeaking();
        this.stopAllMotions();
        
        for(const group in this._sounds){
            this._sounds[group].length = 0;
            delete this._sounds[group];
        }
        this._sounds = undefined;
        
        this.expressionManager?.destroy();

        const self = this as Mutable<Partial<this>>;
        self.definitions = undefined;
        self.motionGroups = undefined;
        
    }

    /**
     * Checks if the motion playback has finished.
     */
    abstract isFinished(): boolean;

    /**
     * Creates a Motion from the data.
     * @param data - Content of the motion file. The format must be consistent with {@link MotionManager.motionDataType}.
     * @param group - The motion group.
     * @param definition - The motion definition.
     * @return The created Motion.
     */
    abstract createMotion(data: ArrayBuffer | JSONObject, group: string, definition: MotionSpec): Motion;

    /**
     * Retrieves the motion's file path by its definition.
     * @return The file path extracted from given definition. Not resolved.
     */
    abstract getMotionFile(definition: MotionSpec): string;

    /**
     * Retrieves the motion's name by its definition.
     * @return The motion's name.
     */
    protected abstract getMotionName(definition: MotionSpec): string;

    /**
     * Retrieves the motion's sound file by its definition.
     * @return The motion's sound file, can be undefined.
     */
    protected abstract getSoundFile(definition: MotionSpec): string | undefined;

    /**
     * Starts the Motion.
     */
    protected abstract _startMotion(motion: Motion, onFinish?: (motion: Motion) => void): number;

    /**
     * Stops all playing motions.
     */
    protected abstract _stopAllMotions(): void;

    /**
     * Updates parameters of the core model.
     * @param model - The core model.
     * @param now - Current time in milliseconds.
     * @return True if the parameters have been actually updated.
     */
    protected abstract updateParameters(model: object, now: DOMHighResTimeStamp): boolean;
}
