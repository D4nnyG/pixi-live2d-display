import { Live2DModel } from './Live2DModel';
import { FederatedMouseEvent } from '@pixi/events';

/**
 * The interaction control split from Live2DModel class for code clarity. This mixin should *only*
 * be used on the Live2DModel.
 */
export class InteractionMixin {
    private _followMouse = false;
    private _touchEvents = false;

    get followMouse(){
        return this._followMouse;
    }

    /**
     * The model will follow the mouse if it's over their area.
     */
    set followMouse(follow: boolean){
        if(this._followMouse === follow) return;

        if(follow){
            (this as any as Live2DModel).on("pointermove", onPointerMove as EventListener);
        } else {
            (this as any as Live2DModel).off("pointermove", onPointerMove as EventListener);
        }

        this._followMouse = follow;
    }

    get touchEvents(){
        return this._touchEvents;
    }

    /**
     * The model will emit touch events
     */
    set touchEvents(touchable: boolean){
        if(this._touchEvents === touchable) return;

        if(touchable){
            (this as any as Live2DModel).on("pointertap", onTap as EventListener);
        } else {
            (this as any as Live2DModel).off("pointertap", onTap as EventListener);
        }

        this._touchEvents = touchable;
    }
}

function onTap(this: Live2DModel, event: FederatedMouseEvent) {
    this.tap(event.globalX, event.globalY);
}

function onPointerMove(this: Live2DModel, event: FederatedMouseEvent) {
    this.focus(event.globalX, event.globalY);
}
