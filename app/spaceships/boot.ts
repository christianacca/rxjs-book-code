import {Game, GameCanvas} from "./app";

let game = new Game(new GameCanvas(document.body, { width: window.innerWidth, height: window.innerHeight }));
game.run();