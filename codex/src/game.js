import { GAME_CONFIG, buildFacilities, spawnIntervalForDifficulty } from "./config.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export class Game {
  constructor({ renderer, audio, storage, ui }) {
    this.renderer = renderer;
    this.audio = audio;
    this.storage = storage;
    this.ui = ui;

    this.state = this.createInitialState();
    this.lastFrame = performance.now();
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  createInitialState() {
    const bestScore = this.storage.getBestScore();

    return {
      screen: "menu",
      score: 0,
      bestScore,
      lives: GAME_CONFIG.startLives,
      difficulty: 1,
      startingDifficulty: 1,
      spawnInterval: spawnIntervalForDifficulty(1),
      queue: [],
      facilities: buildFacilities(),
      nextPatronId: 1,
      spawnTimer: 0,
      outageTimer: GAME_CONFIG.outageCheckSeconds,
      rewardTimer: GAME_CONFIG.rewardCheckSeconds,
      eventFeed: [
        { id: 1, text: "Shift queued. Awaiting your command.", tone: "good" }
      ],
      statusCopy: "Ready for the next shift.",
      messageId: 2,
      effects: [],
      flash: 0,
      gameOverReason: "",
      isNewBest: false
    };
  }

  frame(now) {
    const dt = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;

    if (this.state.screen === "playing") {
      this.update(dt);
    } else {
      this.updateEffects(dt);
      this.state.flash = Math.max(0, this.state.flash - dt * 1.8);
    }

    this.renderer.render(this.state);
    this.syncUi();
    requestAnimationFrame(this.frame);
  }

  startRun() {
    this.state = {
      ...this.createInitialState(),
      screen: "playing",
      difficulty: this.state.startingDifficulty,
      startingDifficulty: this.state.startingDifficulty,
      spawnInterval: spawnIntervalForDifficulty(this.state.startingDifficulty),
      spawnTimer: 0.2,
      bestScore: this.state.bestScore,
      eventFeed: [],
      statusCopy: "Shift live. Route the first guy in line."
    };

    this.addFeed("Shift started. Protocol is live.", "good");
    this.spawnPatron();
    this.audio.cue("assign");
  }

  returnToMenu() {
    this.state = {
      ...this.createInitialState(),
      screen: "menu",
      startingDifficulty: this.state.startingDifficulty,
      difficulty: this.state.startingDifficulty,
      spawnInterval: spawnIntervalForDifficulty(this.state.startingDifficulty),
      bestScore: this.state.bestScore
    };
    this.state.statusCopy = "Ready for the next restroom shift.";
    this.addFeed("Returned to the briefing room.", "warning");
  }

  restartAfterGameOver() {
    this.startRun();
  }

  togglePause() {
    if (this.state.screen === "playing") {
      this.state.screen = "paused";
      this.state.statusCopy = "Protocol paused.";
      this.addFeed("Shift paused.", "warning");
    } else if (this.state.screen === "paused") {
      this.state.screen = "playing";
      this.state.statusCopy = "Protocol resumed.";
      this.addFeed("Shift resumed.", "good");
    }
  }

  toggleMute() {
    const muted = this.audio.toggleMuted();
    this.ui.soundButton.textContent = muted ? "Sound: Off" : "Sound: On";
    this.ui.soundButton.setAttribute("aria-pressed", String(muted));
  }

  setStartingDifficulty(value) {
    const difficulty = clamp(Number.parseInt(value, 10) || 1, 1, 10);
    this.state.startingDifficulty = difficulty;
    this.ui.difficultyValue.textContent = String(difficulty);
    this.ui.difficultyRange.value = String(difficulty);
    if (this.state.screen === "menu") {
      this.state.difficulty = difficulty;
      this.state.spawnInterval = spawnIntervalForDifficulty(difficulty);
    }
  }

  handleCanvasPointer(event) {
    if (this.state.screen !== "playing") return;

    const rect = this.renderer.canvas.getBoundingClientRect();
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    const target = this.renderer.hitTest(point);
    if (target) {
      this.assignFrontPatron(target.id);
    }
  }

  handleKeyDown(event) {
    if (event.key === "m" || event.key === "M") {
      this.toggleMute();
      return;
    }

    if (event.key === " " || event.key === "Escape") {
      if (this.state.screen === "playing" || this.state.screen === "paused") {
        event.preventDefault();
        this.togglePause();
      }
      return;
    }

    if (event.key === "r" || event.key === "R") {
      if (this.state.screen === "gameover") {
        this.restartAfterGameOver();
      }
      return;
    }

    if (this.state.screen !== "playing") return;

    if (/^[1-7]$/.test(event.key)) {
      const index = Number.parseInt(event.key, 10);
      const facilityId = index <= 5 ? `U${index}` : `S${index - 5}`;
      this.assignFrontPatron(facilityId);
    }
  }

  update(dt) {
    this.state.spawnTimer -= dt;
    this.state.outageTimer -= dt;
    this.state.rewardTimer -= dt;
    this.state.flash = Math.max(0, this.state.flash - dt * 1.8);

    if (this.state.spawnTimer <= 0) {
      this.spawnPatron();
      this.state.spawnTimer = this.state.spawnInterval * randomBetween(0.85, 1.05);
    }

    if (this.state.difficulty >= GAME_CONFIG.outageStartDifficulty && this.state.outageTimer <= 0) {
      this.rollForOutage();
      this.state.outageTimer = GAME_CONFIG.outageCheckSeconds;
    }

    if (this.state.rewardTimer <= 0) {
      this.rollForReward();
      this.state.rewardTimer = GAME_CONFIG.rewardCheckSeconds;
    }

    this.updateQueue(dt);
    if (this.state.screen !== "playing") return;
    this.updateFacilities(dt);
    this.updateEffects(dt);
  }

  updateQueue(dt) {
    for (const patron of this.state.queue) {
      patron.patience = Math.max(0, patron.patience - dt);
    }

    const timedOut = this.state.queue.find((patron) => patron.patience <= 0);
    if (timedOut) {
      this.state.queue = this.state.queue.filter((patron) => patron !== timedOut);
      this.audio.cue("timeout");
      this.addFeed(`Guy #${timedOut.id} timed out on the floor.`, "danger");
      this.state.statusCopy = "A timeout cost you a life.";
      this.pushEffect("Timeout", "#ff6b6b", 140, 86);
      this.loseLife("A guy ran out of patience before being assigned.");
    }
  }

  updateFacilities(dt) {
    for (const facility of this.state.facilities) {
      if (facility.disabled) {
        facility.disabledTimer -= dt;
        if (facility.disabledTimer <= 0) {
          facility.disabled = false;
          facility.disabledTimer = 0;
          this.audio.cue("restore");
          this.addFeed(`${facility.kind === "urinal" ? "Urinal" : "Stall"} ${facility.label} restored.`, "good");
        }
      }

      if (facility.occupiedBy) {
        facility.occupiedTimer = Math.max(0, facility.occupiedTimer - dt);
        if (facility.occupiedTimer <= 0) {
          const patronId = facility.occupiedBy.id;
          const kind = facility.kind;
          facility.occupiedBy = null;

          if (kind === "urinal") {
            this.state.score += 1;
            this.audio.cue("urinalScore");
            this.addFeed(`Guy #${patronId} cleared urinal ${facility.label}.`, "good");
            this.state.statusCopy = "Clean urinal turnover. Keep the line moving.";
            this.checkDifficultyRamp();
          } else {
            this.audio.cue("stall");
            this.addFeed(`Guy #${patronId} cleared stall ${facility.label}.`, "warning");
            this.state.statusCopy = "Stall cleared. No score, but the queue survived.";
          }
        }
      }
    }
  }

  updateEffects(dt) {
    this.state.effects = this.state.effects
      .map((effect) => ({
        ...effect,
        y: effect.y - dt * 18,
        life: effect.life - dt * 0.9
      }))
      .filter((effect) => effect.life > 0);
  }

  spawnPatron() {
    const id = this.state.nextPatronId++;
    const maxPatience = randomBetween(GAME_CONFIG.patienceSeconds - 1.3, GAME_CONFIG.patienceSeconds + 0.8);
    this.state.queue.push({
      id,
      patience: maxPatience,
      maxPatience
    });
    this.addFeed(`Guy #${id} entered the restroom queue.`, "warning");
  }

  assignFrontPatron(facilityId) {
    const patron = this.state.queue[0];
    if (!patron) {
      this.state.statusCopy = "Queue is empty. No assignment needed.";
      return;
    }

    const facility = this.state.facilities.find((item) => item.id === facilityId);
    if (!facility || facility.disabled || facility.occupiedBy) {
      this.state.statusCopy = `${facility ? `${facility.kind === "urinal" ? "Urinal" : "Stall"} ${facility.label}` : "That fixture"} is unavailable.`;
      return;
    }

    this.state.queue.shift();
    facility.occupiedBy = patron;
    facility.occupiedDuration =
      facility.kind === "urinal" ? GAME_CONFIG.urinalUseSeconds : GAME_CONFIG.stallUseSeconds;
    facility.occupiedTimer = facility.occupiedDuration;

    this.audio.cue("assign");

    if (facility.reward) {
      facility.reward = false;
      this.state.lives += 1;
      this.audio.cue("reward");
      this.addFeed(`${facility.kind === "urinal" ? "Urinal" : "Stall"} ${facility.label} granted +1 life.`, "good");
      this.state.statusCopy = "Bonus life secured.";
      this.pushEffect("+1 Life", "#78f2b3");
    }

    if (facility.kind === "urinal") {
      this.state.statusCopy = `Guy #${patron.id} routed to urinal ${facility.label}.`;
      this.checkSpacingViolation(facility);
    } else {
      this.state.statusCopy = `Guy #${patron.id} routed to stall ${facility.label}.`;
    }
  }

  checkSpacingViolation(facility) {
    const neighbors = this.state.facilities.filter(
      (candidate) =>
        candidate.kind === "urinal" &&
        candidate.id !== facility.id &&
        Math.abs(candidate.slot - facility.slot) === 1 &&
        candidate.occupiedBy
    );

    if (neighbors.length > 0) {
      this.audio.cue("strike");
      this.addFeed(`Spacing breach at urinal ${facility.label}.`, "danger");
      this.state.statusCopy = "Adjacent urinals are forbidden.";
      this.pushEffect("Spacing Breach", "#ff6b6b");
      this.loseLife("You assigned adjacent urinals and broke the etiquette rule.");
    }
  }

  rollForOutage() {
    const activeOutages = this.state.facilities.filter((facility) => facility.disabled).length;
    if (activeOutages >= GAME_CONFIG.maxOutages) return;

    const chance = clamp(0.14 + (this.state.difficulty - 2) * 0.08, 0.14, 0.5);
    if (Math.random() > chance) return;

    const pool = this.state.facilities.filter(
      (facility) => !facility.disabled && !facility.occupiedBy && !facility.reward
    );
    if (pool.length === 0) return;

    const weighted = [];
    for (const facility of pool) {
      if (facility.kind === "stall") {
        weighted.push(facility, facility);
        continue;
      }

      const evenSlot = (facility.slot + 1) % 2 === 0;
      const weight =
        this.state.difficulty <= 5
          ? evenSlot ? 3 : 1
          : evenSlot ? 1 : 3;
      for (let count = 0; count < weight; count += 1) {
        weighted.push(facility);
      }
    }

    const selected = weighted[Math.floor(Math.random() * weighted.length)];
    selected.disabled = true;
    selected.disabledTimer = randomBetween(...GAME_CONFIG.outageDurationRange);
    this.audio.cue("disable");
    this.addFeed(`${selected.kind === "urinal" ? "Urinal" : "Stall"} ${selected.label} went into maintenance.`, "warning");
    this.state.statusCopy = "Maintenance alert. Routing space just tightened.";
  }

  rollForReward() {
    if (Math.random() > GAME_CONFIG.rewardChance) return;

    const pool = this.state.facilities.filter(
      (facility) => !facility.disabled && !facility.reward && !facility.occupiedBy
    );
    if (pool.length === 0) return;

    const weighted = [];
    for (const facility of pool) {
      const weight = facility.kind === "stall" ? 3 : (facility.slot + 1) % 2 === 0 ? 3 : 1;
      for (let count = 0; count < weight; count += 1) {
        weighted.push(facility);
      }
    }

    const selected = weighted[Math.floor(Math.random() * weighted.length)];
    selected.reward = true;
    this.addFeed(`${selected.kind === "urinal" ? "Urinal" : "Stall"} ${selected.label} is glowing with a bonus.`, "good");
  }

  checkDifficultyRamp() {
    if (this.state.score > 0 && this.state.score % GAME_CONFIG.difficultyEveryScore === 0) {
      this.state.difficulty += 1;
      this.state.spawnInterval = spawnIntervalForDifficulty(this.state.difficulty);
      this.audio.cue("levelUp");
      this.addFeed(`Difficulty increased to ${this.state.difficulty}.`, "warning");
      this.state.statusCopy = "The queue is accelerating.";
      this.pushEffect(`Difficulty ${this.state.difficulty}`, "#ffb347", this.renderer.width * 0.72, 94);
    }
  }

  loseLife(reason) {
    this.state.lives -= 1;
    this.state.flash = 0.42;

    if (this.state.lives <= 0) {
      this.endGame(reason);
      return;
    }

    this.addFeed(`${this.state.lives} lives remaining.`, "danger");
  }

  endGame(reason) {
    this.state.screen = "gameover";
    this.state.gameOverReason = reason;
    this.state.isNewBest = this.state.score > this.state.bestScore;
    if (this.state.isNewBest) {
      this.state.bestScore = this.state.score;
      this.storage.setBestScore(this.state.bestScore);
    }

    this.audio.cue("gameOver");
    this.addFeed("Shift collapsed. Debrief available.", "danger");
    this.state.statusCopy = "Shift failed. Review the breakdown and run it back.";
  }

  addFeed(text, tone = "warning") {
    const id = this.state.messageId++;
    this.state.eventFeed = [{ id, text, tone }, ...this.state.eventFeed].slice(0, GAME_CONFIG.maxFeedItems);
    this.ui.live.textContent = text;
  }

  pushEffect(text, color, x = this.renderer.width * 0.72, y = 134) {
    this.state.effects.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      text,
      color,
      x,
      y,
      life: 1
    });
  }

  syncUi() {
    this.ui.scoreValue.textContent = String(this.state.score);
    this.ui.bestValue.textContent = String(this.state.bestScore);
    this.ui.livesValue.textContent = String(this.state.lives);
    this.ui.difficultyLive.textContent = String(this.state.screen === "menu" ? this.state.startingDifficulty : this.state.difficulty);
    this.ui.queueValue.textContent = String(this.state.queue.length);
    this.ui.spawnValue.textContent = `${this.state.spawnInterval.toFixed(2)}s`;
    this.ui.statusCopy.textContent = this.state.statusCopy;

    this.ui.menuScreen.classList.toggle("hidden", this.state.screen !== "menu");
    this.ui.pauseScreen.classList.toggle("hidden", this.state.screen !== "paused");
    this.ui.gameoverScreen.classList.toggle("hidden", this.state.screen !== "gameover");

    this.ui.finalScore.textContent = String(this.state.score);
    this.ui.finalBest.textContent = String(this.state.bestScore);
    this.ui.gameoverReason.textContent = this.state.gameOverReason;
    this.ui.newBestBadge.classList.toggle("hidden", !this.state.isNewBest);

    this.ui.eventFeed.replaceChildren(
      ...this.state.eventFeed.map((item) => {
        const li = document.createElement("li");
        li.textContent = item.text;
        li.dataset.tone = item.tone;
        return li;
      })
    );
  }
}
