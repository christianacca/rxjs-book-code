declare namespace EarthQuakes {
    
    export interface EarthQuake {
        geometry: {
            type: string;
            coordinates: number[]
        },
        properties: {
            mag: number,
            [name: string]: any
        }
    }
    
    export interface Dataset {
        features: EarthQuake[];
    }
    
    export type JsonpCbFunc = {(data: Dataset) : void};
}