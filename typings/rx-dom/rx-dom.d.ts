declare module Rx {
    export module DOM {
        export interface AjaxSettings {
            async?: boolean;
            body?: string;
            // This options does not seem to be used in the code yet
            // contentType?: string;
            crossDomain?: boolean;
            headers?: any;
            method?: string;
            password?: string;
            progressObserver?: Rx.Observer<any>;
            responseType?: string;
            url?: string;
            user?: string;
        }

        export interface AjaxSuccessResponse {
            response: any;
            status: number;
            responseType: string;
            xhr: XMLHttpRequest;
            originalEvent: Event;
        }

        export interface AjaxErrorResponse {
            type: string;
            status: number;
            xhr: XMLHttpRequest;
            originalEvent: Event;
        }

        export interface JsonpSettings {
            async?: boolean;
            jsonp?: string;
            jsonpCallback?: string;
            url?: string;
        }

        export interface JsonpSuccessResponse<T>{
            response: T;
            status: number;
            responseType: string;
            originalEvent: Event;
        }

        export interface JsonpErrorResponse {
            type: string;
            status: number;
            originalEvent: Event;
        }

        export interface GeolocationOptions {
            enableHighAccuracy?: boolean;
            timeout?: number;
            maximumAge?: number;
        }

        // Events
        function fromEvent<T>(element:any, eventName:string, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function ready<T>():Rx.Observable<T>;

        // Event Shortcuts
        function blur<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function change<T>(element:any, selector?:Function):Rx.Observable<T>;

        function click<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function contextmenu<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function dblclick<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function error<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function focus<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function focusin<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function focusout<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function keydown<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function keypress<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function keyup<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function load<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function mousedown<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function mouseenter<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function mouseleave<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function mousemove<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function mouseout<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function mouseover<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function mouseup<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function resize<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function scroll<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function select<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function submit<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function unload<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        // Pointer Events
        function pointerdown<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function pointerenter<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function pointerleave<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function pointermove<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function pointerout<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function pointerover<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function pointerup<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        // Touch Events
        function touchcancel<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function touchend<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function touchmove<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        function touchstart<T>(element:any, selector?:Function, useCapture?:boolean):Rx.Observable<T>;

        // Ajax
        function ajax(url:string):Rx.Observable<AjaxSuccessResponse | AjaxErrorResponse>;
        function ajax(settings:AjaxSettings):Rx.Observable<AjaxSuccessResponse | AjaxErrorResponse>;

        function get(url:string):Rx.Observable<AjaxSuccessResponse | AjaxErrorResponse>;

        function getJSON<T>(url:string):Rx.Observable<T>;

        function post(url:string, body:any):Rx.Observable<AjaxSuccessResponse | AjaxErrorResponse>;

        function jsonpRequest<T>(url:string):Rx.Observable<T>;
        function jsonpRequest<T>(settings:JsonpSettings):Rx.Observable<JsonpSuccessResponse<T> | JsonpErrorResponse>;

        // Server-Sent Events
        function fromEventSource<T>(url:string, openObservable?:Rx.Observer<any>):Rx.Observable<T>;

        // Web Sockets
        function fromWebSocket<T>(url:string, protocol:string, openObserver?:Rx.Observer<T>, closingObserver?:Rx.Observer<T>):Rx.Subject<T>;

        // Web Workers
        function fromWebWorker<T>(url:string):Rx.Subject<T>;

        // Mutation Observers
        function fromMutationObserver<T>(target:Node, options:MutationObserverInit):Rx.Observable<T>;

        // Geolocation
        export module geolocation {
            function getCurrentPosition<T>(geolocationOptions?:GeolocationOptions):Rx.Observable<T>;

            function watchPosition<T>(geolocationOptions?:GeolocationOptions):Rx.Observable<T>;
        }
    }
}

declare module "rx.DOM" {
    export = Rx.DOM;
}
