import { Hittable } from "./game-model";

var RxObsConstructor = (<any> Rx.Observable);   // this hack is neccessary because the .d.ts for RxJs declares Observable as an interface)

declare module "rx" {
    interface Observable<T> {
        animateHittable<T extends Hittable>(animationTicker$: Rx.Observable<any>, moveSelector: (y: number) => number, finishSelector: (y: number) => boolean) : Rx.Observable<T>
    }
}

RxObsConstructor.prototype.animateHittable = animateHittable;

function animateHittable<T extends Hittable>(animationTicker$: Rx.Observable<any>, moveSelector: (y: number) => number, finishSelector: (y: number) => boolean) {
    let source: Rx.Observable<T> = this;
    return source.map(hittable => {
        return animationTicker$
            .scan(moveSelector, hittable.y)
            .takeWhile(newY => finishSelector(newY) && !hittable.hasHit)
            .do(newY => {
                hittable.y = newY;
            })
            .map(_ => hittable)
            .startWith(hittable);
    });
}