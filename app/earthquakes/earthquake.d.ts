declare namespace EarthQuakes {
    
    export interface EarthQuakeProperties {
        code: string,
        mag: number,
        net: string,            
        place: string,
        time: string,
        [name: string]: any
    }
    
    export interface EarthQuake {
        geometry: {
            type: string;
            coordinates: number[]
        },
        id: string,
        properties: EarthQuakeProperties
    }
    
    export interface Dataset {
        features: EarthQuake[];
    }
    
    export type JsonpCbFunc = {(data: Dataset) : void};
}