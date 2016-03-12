declare module Rx {
    export interface Observable<T> extends IObservable<T> {
        combineActive<TResult>() : Rx.Observable<TResult[]>
    }
}