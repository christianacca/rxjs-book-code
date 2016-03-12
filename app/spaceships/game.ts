import  "./rx-custom-operators";
import "./animateHittable-operator";
import { Coordinate, Hittable, Star } from "./game-model";
import GameCanvas from "./gameCanvas";

interface Collission {
    ship: Hittable,
    shot: Hittable
}

interface Scene { 
    stars: Star[], 
    heroShip: Hittable, 
    enemyShips: Hittable[], 
    heroShots: Coordinate[], 
    enemyShots: Coordinate[],
    score: number
}

export default class Game {
    private HERO_Y: number;
    private animationTicker$: Rx.ConnectableObservable<number>
    constructor(private gameCanvas: GameCanvas) {      
        this.HERO_Y = this.gameCanvas.height - 30;
        this.animationTicker$ = Rx.Observable.interval(40).publish();
    }
    private static applyCollision(collisions: Collission[]) {
        collisions.forEach(c => {
            c.ship.hasHit = true;
            c.shot.hasHit = true;
        });
    }
    private createCollissions$(items$: Rx.Observable<Hittable[]>, otherItems$: Rx.Observable<Hittable[]>){
        return items$.combineLatest(otherItems$, (items, otherItems) => {
            // really don't like that we having to repeat filtering logic here and in other places
            otherItems = otherItems.filter(item => !item.hasHit);
            items = items.filter(item => !item.hasHit);
            return items
                .map(shot => {
                    const ship = otherItems.filter(ship => Game.isCollision(ship, shot))[0];
                    return { ship, shot };
                })
                .filter(collision => collision.ship !== undefined);
        })
        .filter(c => c.length > 0);
    }
    private createHeroShip$(){
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
    private createEnemyShipsArriving$(){
        const ENEMY_FREQ = 1500;
        return Rx.Observable.interval(ENEMY_FREQ)
            .map<Hittable>(_ => ({
                    x: Math.floor(Math.random() * this.gameCanvas.width),
                    y: 30
            }));
    }
    private createEnemyShips$(arrivingShips$: Rx.Observable<Hittable>){
        return arrivingShips$
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
    private createScore$(heroHits$: Rx.Observable<Collission[]>){
        return heroHits$.scan((score, collissions) => score + collissions.length, 0)
    }
    private static createShot({x,y}: Coordinate){
        return {x, y, hasHit: false};
    }
    private createHeroShots$(heroShip$: Rx.IObservable<Hittable>) {  
        return Rx.Observable.merge<UIEvent>(this.gameCanvas.getClicks$(), this.gameCanvas.getSpacebars$())
            .sample(200)
            .withLatestFrom(heroShip$, (shot, ship) => Game.createShot(ship))
            .animateHittable(this.animationTicker$, Game.moveHeroShot, y => this.gameCanvas.isVisible(y))
            .combineActive<Hittable>()
            .startWith([]);
    }
    private createEnemyShots$(arrivingShips$: Rx.Observable<Hittable>, fireRate$: Rx.Observable<number>) {
        return arrivingShips$.flatMap(ship => {
            return fireRate$.flatMapLatest(rate => Rx.Observable.interval(rate))
                    .takeWhile(_ => !ship.hasHit)
                    .map(_ => Game.createShot(ship))
                    .animateHittable(this.animationTicker$, Game.moveEnemyShot, y => this.gameCanvas.isVisible(y));
        })
        .combineActive<Hittable>()
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
    private static moveEnemyShot(y: number){
        return y+15;
    }
    private moveStar(star: Star){
        if (star.y >= this.gameCanvas.height) {
            star.y = 0;
        } else {
            star.y += 3;
        }
    }
    private createEnemyShotFrequency$(currentScore$: Rx.Observable<number>) {
        const initialRate = 2000;
        return currentScore$.map(score => {
            if (score > 5){
                return 700;
            } else if (score > 2) {
                return 1000;
            } else {
                return initialRate;
            }
        })
        .distinctUntilChanged()
        .startWith(initialRate);
    }
    private renderScene({ stars, heroShip, enemyShips, heroShots, enemyShots, score}: Scene){
        this.gameCanvas.paintStars(stars);
        this.gameCanvas.paintSpaceShip(heroShip);
        enemyShips.forEach(ship => {
            this.gameCanvas.paintEnemySpaceShip(ship);
        });
        heroShots.forEach(shot => {
            this.gameCanvas.paintHeroShot(shot);
        });
        enemyShots.forEach(shot => {
            this.gameCanvas.paintEnemyShot(shot);
        });
        this.gameCanvas.paintScore(score);
    }
    run() {
        let stars$ = this.createStars$();
        let heroShip$ = this.createHeroShip$().share(); 
        let heroShots$ = this.createHeroShots$(heroShip$).share();
        let arrivingEnemies$ = this.createEnemyShipsArriving$().share();
        let enemyShips$ = this.createEnemyShips$(arrivingEnemies$).share();
        let heroHits$ = this.createCollissions$(heroShots$, enemyShips$).startWith([])
            .do(Game.applyCollision)
            .share();
        let score$ = this.createScore$(heroHits$).share();
        let fireRate$ = this.createEnemyShotFrequency$(score$).shareReplay(1);
        let enemyShots$ = this.createEnemyShots$(arrivingEnemies$, fireRate$).share();
        let enemyHits$ = this.createCollissions$(enemyShots$, heroShip$.map(ship => [ship]))
            .do(Game.applyCollision);
        let shotsShot$ = this.createCollissions$(heroShots$, enemyShots$).startWith([])
            .do(Game.applyCollision);
        
        
        let game$ = Rx.Observable.combineLatest(
            stars$, heroShip$, enemyShips$, heroShots$, enemyShots$, score$, heroHits$, shotsShot$, (stars, heroShip, enemyShips, heroShots, enemyShots, score) => {
                return {stars, heroShip, enemyShips, heroShots, enemyShots, score};
        }).takeUntil(enemyHits$);
        
        game$.subscribe(actors => this.renderScene(actors));
        this.animationTicker$.connect();
    }
}

