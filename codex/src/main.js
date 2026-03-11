import { AudioController } from "./audio.js";
import { Game } from "./game.js";
import { Renderer } from "./renderer.js";
import { Storage } from "./storage.js";

const ui = {
  canvas: document.getElementById("game-canvas"),
  startButton: document.getElementById("start-button"),
  restartButton: document.getElementById("restart-button"),
  soundButton: document.getElementById("sound-button"),
  homeButton: document.getElementById("home-button"),
  difficultyMinus: document.getElementById("difficulty-minus"),
  difficultyPlus: document.getElementById("difficulty-plus"),
  difficultyValue: document.getElementById("difficulty-value"),
  difficultyRange: document.getElementById("difficulty-range"),
  scoreValue: document.getElementById("score-value"),
  bestValue: document.getElementById("best-value"),
  livesValue: document.getElementById("lives-value"),
  difficultyLive: document.getElementById("difficulty-live"),
  queueValue: document.getElementById("queue-value"),
  spawnValue: document.getElementById("spawn-value"),
  statusCopy: document.getElementById("status-copy"),
  eventFeed: document.getElementById("event-feed"),
  menuScreen: document.getElementById("menu-screen"),
  pauseScreen: document.getElementById("pause-screen"),
  gameoverScreen: document.getElementById("gameover-screen"),
  finalScore: document.getElementById("final-score"),
  finalBest: document.getElementById("final-best"),
  gameoverReason: document.getElementById("gameover-reason"),
  newBestBadge: document.getElementById("new-best-badge"),
  live: document.getElementById("sr-live")
};

const renderer = new Renderer(ui.canvas);
const audio = new AudioController();
const storage = new Storage();
const game = new Game({ renderer, audio, storage, ui });

ui.startButton.addEventListener("click", async () => {
  await audio.unlock();
  game.startRun();
});

ui.restartButton.addEventListener("click", async () => {
  await audio.unlock();
  game.restartAfterGameOver();
});

ui.soundButton.addEventListener("click", async () => {
  await audio.unlock();
  game.toggleMute();
});

ui.homeButton.addEventListener("click", () => {
  game.returnToMenu();
});

ui.difficultyMinus.addEventListener("click", () => {
  game.setStartingDifficulty(Number(ui.difficultyRange.value) - 1);
});

ui.difficultyPlus.addEventListener("click", () => {
  game.setStartingDifficulty(Number(ui.difficultyRange.value) + 1);
});

ui.difficultyRange.addEventListener("input", () => {
  game.setStartingDifficulty(ui.difficultyRange.value);
});

ui.canvas.addEventListener("pointerdown", async (event) => {
  await audio.unlock();
  game.handleCanvasPointer(event);
});

window.addEventListener("keydown", (event) => {
  game.handleKeyDown(event);
});

window.addEventListener("resize", () => {
  renderer.resize();
});

game.setStartingDifficulty(1);
