type Star = {
    size: number
} & Coordinate

interface Coordinate {
    x: number,
    y: number
}

interface CoordinatePositionState<T extends Coordinate> {
    current: T[],
    previous: T[]
}

interface Collision {
    ship: SpaceShip,
    shot: Coordinate
}

class SpaceShip implements Coordinate {
    x: number;
    y: number;
    constructor({ x, y} = { x: 0, y: 0}) {
        this.x = x;
        this.y = y;
    }
    static isCollision(target1: Coordinate, target2: Coordinate) {
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
    private animationTicker$: Rx.ConnectableObservable<number>
    constructor(private gameCanvas: GameCanvas) {      
        this.HERO_Y = this.gameCanvas.height - 30;
        this.animationTicker$ = Rx.Observable.interval(40).publish();
    }
    
    private createCollissions(heroShots$: Rx.Observable<Coordinate[]>, enemySpaceShips$: Rx.Observable<SpaceShip[]>){
        return Rx.Observable.combineLatest(heroShots$, enemySpaceShips$, (shots, ships) => {
            return shots
                .map(shot => {
                    const ship = ships.filter(ship => SpaceShip.isCollision(ship, shot))[0];
                    return { ship, shot };
                })
                .filter(collision => collision.ship !== undefined);
        });
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
    
    private createEnemySpaceShips$(){
        const ENEMY_FREQ = 1500;
        const initialState: CoordinatePositionState<SpaceShip> = {
            current: [],
            previous: []
        };
        return Rx.Observable.interval(ENEMY_FREQ)
            .scan((state, _) => {
                const pos = {
                    x: Math.floor(Math.random() * this.gameCanvas.width),
                    y: 30
                };
                state.current.push(new SpaceShip(pos));
                return state;
            }, initialState)
            .combineLatest(this.animationTicker$, (state, _) => {
                Game.moveGameElements(state, this.gameCanvas, Game.moveEnemyShip);
                return state;
            })
            .filter(state => state.current.length > 0)
            .map(state => state.current);
    }
    
    private createStar() {
        return {
            x: Math.floor(Math.random() * this.gameCanvas.width),
            y: Math.floor(Math.random() * this.gameCanvas.height),
            size: (Math.random() * 3) + 1
        };
    }
    
        // note: an alternative solution would be to use mergeScan
    private createHeroShots$(heroShip$: Rx.IObservable<SpaceShip>) {
        // (see: http://codepen.io/christianacca/pen/MyaOgY?editors=0011)
        let initialState: CoordinatePositionState<Coordinate> = {
            current: [],
            previous: []
        }
        
        return Rx.Observable.merge<UIEvent>(this.gameCanvas.getClicks$(), this.gameCanvas.getSpacebars$())
            .sample(200)
            .withLatestFrom(heroShip$, (shot, ship) => {
                return { x: ship.x, y: ship.y, isVisible: true };
            })
            .scan((state, shot) => {
                state.current.push(shot);
                return state;
            }, initialState)
            .combineLatest(this.animationTicker$, (state, _) => {
                Game.moveGameElements(state, this.gameCanvas, Game.moveHeroShot);
                return state;
            })
            .filter(state => state.current.length > 0)
            .map(state => state.current)
            .startWith([] as Coordinate[]);
    }
    
    private createStars$() {
        return Rx.Observable.range(1, 250)
            .map(_ => this.createStar())
            .toArray()
            .flatMap(stars => {
                return this.animationTicker$
                    .map(_ => {
                        stars.forEach(star => this.moveStar(star));
                        return stars;
                    });
            });
    }
    private static moveEnemyShip(ship: Coordinate){
        ship.y += 5;
    }
    private static moveGameElements<T extends Coordinate>(state: CoordinatePositionState<T>, gameCanvas: GameCanvas, move: (item: Coordinate) => void) : void {
        const { current, previous } = state;
        previous.forEach(item => {
            move(item);
        });
        const offscreenElements = current.filter(item => !gameCanvas.isVisible(item))
        offscreenElements.forEach(item => {
            Game.removeInstance(current, item);
        });                
        state.previous = current.slice();
    }
    private static moveHeroShot(shot: Coordinate){
        shot.y -= 15;
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
    private static removeInstances<T>(list: Array<T>, instances: Array<T>) {
        instances.forEach(function(instance) {
            Game.removeInstance(list, instance);
        });
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
        let heroShots$ = this.createHeroShots$(heroSpaceShip$).share();
        let enemySpaceShips$ = this.createEnemySpaceShips$().share();
        let collisions$ = this.createCollissions(heroShots$, enemySpaceShips$).startWith([]);
        
        let nonCollided$ = Rx.Observable.combineLatest(collisions$, heroShots$, enemySpaceShips$, (collisions, heroShots, enemySpaceShips) => {
            Game.removeInstances(heroShots, collisions.map(c => c.shot));
            Game.removeInstances(enemySpaceShips, collisions.map(c => c.ship));
            return { heroShots, enemySpaceShips}
        });
        
        let game$ = Rx.Observable.combineLatest(stars$, heroSpaceShip$, nonCollided$, (stars, heroSpaceShip, {enemySpaceShips, heroShots}) => {
            return {stars, heroSpaceShip, enemySpaceShips, heroShots};
        });
        
        game$.subscribe(actors => this.renderScene(actors));
        this.animationTicker$.connect()
    }
}

