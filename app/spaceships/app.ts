type Star = {
    size: number
} & Coordinate

interface Coordinate {
    x: number,
    y: number,
    isVisible?: boolean
}

class SpaceShip implements Coordinate {
    x: number;
    y: number;
    isDestroyed = false;
    constructor({ x, y} = { x: 0, y: 0}) {
        this.x = x;
        this.y = y;
    }
    tryHit(shots: Coordinate[]) {
        if (this.isDestroyed) return;
        
        this.isDestroyed = shots.some(shot => SpaceShip.isCollision(this, shot));
        if (this.isDestroyed){
            console.log("ship destroyed", this);
        }
    }
    private static isCollision(target1: Coordinate, target2: Coordinate) {
        return (target1.x > target2.x - 20 && target1.x < target2.x + 20) &&
                (target1.y > target2.y - 20 && target1.y < target2.y + 20);
    }
}

export class GameCanvas {
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
    isVisible({x, y}: Coordinate){
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

export class Game {
    private HERO_Y: number;
    private SPEED = 40;
    constructor(private gameCanvas: GameCanvas) {      
        this.HERO_Y = this.gameCanvas.height - 30;
    }
    private createHeroSpaceShip$(){
        return this.gameCanvas.getMouseMoves$()
            .map(mousePos => {
                return new SpaceShip({ 
                    x: mousePos.clientX,
                    y: this.HERO_Y
                })
            }).startWith(new SpaceShip({
                x: this.gameCanvas.width / 2,
                y: this.HERO_Y
            }));
    }
    private createEnemySpaceShips$($heroShots: Rx.IObservable<Coordinate[]>){
        const ENEMY_FREQ = 1500;
        return Rx.Observable.interval(ENEMY_FREQ)
            .scan((ships, _) => {
                const pos = {
                    x: Math.floor(Math.random() * this.gameCanvas.width),
                    y: 30
                };
                ships.push(new SpaceShip(pos));
                return ships;
            }, [] as SpaceShip[])
            .combineLatest(Rx.Observable.interval(40), $heroShots, (ships, i, shots) => {
                ships.forEach(ship => {
                    Game.moveEnemyShip(ship);
                    ship.tryHit(shots);
                });
                
                return ships.filter(ship => this.gameCanvas.isVisible(ship) && !ship.isDestroyed);
            });
    }
    private createStar() {
        return {
            x: Math.floor(Math.random() * this.gameCanvas.width),
            y: Math.floor(Math.random() * this.gameCanvas.height),
            size: (Math.random() * 3) + 1
        };
    }
    private createHeroShots$(heroShip$: Rx.IObservable<SpaceShip>) {
        return Rx.Observable.merge<UIEvent>(this.gameCanvas.getClicks$(), this.gameCanvas.getSpacebars$())
            .sample(200)
            .withLatestFrom(heroShip$, (shot, ship) => {
                return { x: ship.x, y: ship.y };
            })
            .scan((shots, shot) => {
                shots.push(shot);
                return shots;
            }, [] as Coordinate[])
            .combineLatest(Rx.Observable.interval(40), (shots, i) => {
                shots.forEach(shot => {
                    this.moveHeroShot(shot);
                });
                return shots.filter(shot => shot.isVisible);;
            }).startWith([]);
    }
    
    private createHeroShots2$(heroShip$: Rx.IObservable<SpaceShip>) {
        return Rx.Observable.merge<UIEvent>(this.gameCanvas.getClicks$(), this.gameCanvas.getSpacebars$())
            .sample(200)
            .withLatestFrom(heroShip$, (shot, ship) => {
                return { x: ship.x, y: ship.y, isVisible: true };
            })
            .map(shot => {
                let animatedShot$ = Rx.Observable.interval(40).map(_ => {
                    this.moveHeroShot(shot);
                    return shot;
                })
                .takeWhile(movedShot => movedShot.isVisible)
                .startWith(shot);
                return animatedShot$;
            }).scan((shotStreams, shot$) => {
                return shotStreams.concat([shot$]);
            }, [] as Rx.Observable<Coordinate>[])
            .flatMapLatest(shotStreams => Rx.Observable.combineLatest(shotStreams, (...shots) => shots))
            .do(shots => {
                console.log("shots", shots)
            })
            .startWith([])
    }
    
    private createStars$() {
        return Rx.Observable.range(1, 250)
            .map(_ => this.createStar())
            .toArray()
            .flatMap(stars => {
                return Rx.Observable.interval(this.SPEED)
                    .map(_ => {
                        stars.forEach(star => this.moveStar(star));
                        return stars;
                    });
            });
    }
    private static moveEnemyShip(ship: SpaceShip){
        ship.y += 5;
    }
    private moveHeroShot(shot: Coordinate){
        shot.y -= 15;
        shot.isVisible = this.gameCanvas.isVisible(shot);
    }
    private moveStar(star: Star){
        if (star.y >= this.gameCanvas.height) {
            star.y = 0;
        } else {
            star.y += 3;
        }
    }
    private static removeInstance<T>(list: Array<T>, instance: T) {
        let index = list.indexOf(instance);
        if (index !== -1) {
            list.splice(index, 1);
        }
        return index;
    }
    private renderScene({ stars, heroSpaceShip, enemySpaceShips, heroShots}: { stars: Star[], heroSpaceShip: SpaceShip, enemySpaceShips: SpaceShip[], heroShots: Coordinate[] }){
        this.gameCanvas.paintStars(stars);
        this.gameCanvas.paintSpaceShip(heroSpaceShip);
        enemySpaceShips.forEach(ship => {
            this.gameCanvas.paintEnemySpaceShip(ship);
        });
        heroShots.forEach(shot => {
            this.gameCanvas.paintHeroShot(shot);
        });
    }
    run() {
        let stars$ = this.createStars$();
        let heroSpaceShip$ = this.createHeroSpaceShip$();
        let heroShots$ = this.createHeroShots$(heroSpaceShip$);
        let enemySpaceShips$ = this.createEnemySpaceShips$(heroShots$);
        
        let game$ = Rx.Observable.combineLatest(stars$, heroSpaceShip$, enemySpaceShips$, heroShots$, (stars, heroSpaceShip, enemySpaceShips, heroShots) => {
            return {stars, heroSpaceShip, enemySpaceShips, heroShots};
        });
        
        game$.subscribe(actors => this.renderScene(actors));
    }
}
