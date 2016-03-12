import { Coordinate, Hittable, Star } from "./game-model";

export default class GameCanvas {
    private surface: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    constructor(screenContainer: HTMLElement, {width, height} : {width: number, height: number}) {
        this.surface = document.createElement('canvas');
        this.ctx = this.surface.getContext("2d");
        this.surface.width = width;
        this.surface.height = height;
        screenContainer.appendChild(this.surface);
    }
    get height() : number {
        return this.surface.height;
    }
    get width() : number {
        return this.surface.width;
    }
    private drawTriangle(x: number, y: number, width: number, color: string | CanvasGradient | CanvasPattern, direction: string) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x - width, y);
        this.ctx.lineTo(x, direction === 'up' ? y - width : y + width);
        this.ctx.lineTo(x + width, y);
        this.ctx.lineTo(x - width,y);
        this.ctx.fill();
    }
    getMouseMoves$() {
        return Rx.Observable.fromEvent<MouseEvent>(this.surface, "mousemove");
    }
    getClicks$(){
        return Rx.Observable.fromEvent<MouseEvent>(this.surface, "click");
    }
    getSpacebars$(){
        return Rx.Observable.fromEvent<KeyboardEvent>(this.surface, "keydown").filter(key => key.keyCode === 32);
    }
    isVisible(coordinate: Coordinate): boolean;
    isVisible(y: number): boolean;
    isVisible(value: Coordinate | number ) : boolean{
        let y = typeof value === "number" ? value : value.y;
        return y <= this.height && y >= 0;
    }
    paintSpaceShip({x, y}: Coordinate){
        this.drawTriangle(x, y, 20, "#ff0000", "up");
    }
    paintEnemySpaceShip({x, y}: Coordinate){
        this.drawTriangle(x, y, 20, "#ff0000", "down");
    }
    paintHeroShot({x, y}: Coordinate){
        this.drawTriangle(x, y, 5, '#ffff00', 'up');
    }
    paintStars(stars: Star[]) {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.surface.width, this.surface.height);
        this.ctx.fillStyle = '#ffffff';
        stars.forEach(star => {
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }
}
