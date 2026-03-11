const BEST_SCORE_KEY = "checkmate_codex_best";

export class Storage {
  getBestScore() {
    try {
      const stored = window.localStorage.getItem(BEST_SCORE_KEY);
      const parsed = Number.parseInt(stored ?? "0", 10);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch {
      return 0;
    }
  }

  setBestScore(score) {
    try {
      window.localStorage.setItem(BEST_SCORE_KEY, String(score));
    } catch {
      return false;
    }
    return true;
  }
}
