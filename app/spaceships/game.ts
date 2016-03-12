import  "./rx-custom-operators";
import "./animateHittable-operator";
import { Coordinate, Hittable, Star } from "./game-model";
import GameCanvas from "./gameCanvas";

export default class Game {
    private HERO_Y: number;
    private animationTicker$: Rx.ConnectableObservable<number>
    constructor(private gameCanvas: GameCanvas) {      
        this.HERO_Y = this.gameCanvas.height - 30;
        this.animationTicker$ = Rx.Observable.interval(40).publish();
    }
    private static applyCollision(collisions: {ship: Hittable, shot: Hittable}[]) {
        collisions.forEach(c => {
            c.ship.hasHit = true;
            c.shot.hasHit = true;
        });
    }
    private createCollissions$(heroShots$: Rx.Observable<Hittable[]>, enemySpaceShips$: Rx.Observable<Hittable[]>){
        return heroShots$.combineLatest(enemySpaceShips$, (shots, ships) => {
            return shots
                .map(shot => {
                    const ship = ships.filter(ship => Game.isCollision(ship, shot))[0];
                    return { ship, shot };
                })
                .filter(collision => collision.ship !== undefined);
        });
    }
    private createHeroSpaceShip$(){
        return this.gameCanvas.getMouseMoves$()
            .map(mousePos => ({ 
                    x: mousePos.clientX,
                    y: this.HERO_Y
                }))
            .startWith({
                x: this.gameCanvas.width / 2,
                y: this.HERO_Y
            });
    }    
    private createEnemySpaceShips$(){
        const ENEMY_FREQ = 1500;
        return Rx.Observable.interval(ENEMY_FREQ)
            .map<Hittable>(_ => ({
                    x: Math.floor(Math.random() * this.gameCanvas.width),
                    y: 30
            }))
            .animateHittable(this.animationTicker$, Game.moveEnemyShip, y => this.gameCanvas.isVisible(y))
            .combineActive<Hittable>()
            .startWith([]);
    }
    
    private createStar() {
        return {
            x: Math.floor(Math.random() * this.gameCanvas.width),
            y: Math.floor(Math.random() * this.gameCanvas.height),
            size: (Math.random() * 3) + 1
        };
    }
    
    private createHeroShots$(heroShip$: Rx.IObservable<Hittable>) {  
        return Rx.Observable.merge<UIEvent>(this.gameCanvas.getClicks$(), this.gameCanvas.getSpacebars$())
            .sample(200)
            .withLatestFrom(heroShip$, (shot, ship) => {
                return { x: ship.x, y: ship.y, hasHit: false };
            })
            .animateHittable(this.animationTicker$, Game.moveHeroShot, y => this.gameCanvas.isVisible(y))
            .combineActive<Hittable>()
            .startWith([]);
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
    private static isCollision(target1: Coordinate, target2: Coordinate) {
        return (target1.x > target2.x - 20 && target1.x < target2.x + 20) &&
                (target1.y > target2.y - 20 && target1.y < target2.y + 20);
    }
    private static moveEnemyShip(y: number){
        return y+5;
    }
    private static moveHeroShot(y: number){
        return y-15;
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

    private renderScene({ stars, heroSpaceShip, enemySpaceShips, heroShots}: { stars: Star[], heroSpaceShip: Hittable, enemySpaceShips: Hittable[], heroShots: Coordinate[] }){
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
        let heroShots$ = this.createHeroShots$(heroSpaceShip$).share().do(() => console.log("shot"));
        let enemySpaceShips$ = this.createEnemySpaceShips$().share();
        let collisions$ = this.createCollissions$(heroShots$, enemySpaceShips$).startWith([])
            .do(Game.applyCollision);
        
        let game$ = Rx.Observable.combineLatest(stars$, heroSpaceShip$, enemySpaceShips$, heroShots$, collisions$, (stars, heroSpaceShip, enemySpaceShips, heroShots) => {
            return {stars, heroSpaceShip, enemySpaceShips, heroShots};
        });
        
        game$.subscribe(actors => this.renderScene(actors));
        this.animationTicker$.connect();
    }
}

