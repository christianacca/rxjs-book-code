export type Star = {
    size: number
} & Coordinate

export interface Coordinate {
    x: number;
    y: number
}

export interface Hittable extends Coordinate {
    hasHit?: boolean;
}