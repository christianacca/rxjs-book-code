/// <reference path="./earthquake.d.ts" />

declare interface Window {
    eqfeed_callback: EarthQuakes.JsonpCbFunc;
}