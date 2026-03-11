// js/StorageManager.js

export class StorageManager {
    constructor() {
        this.highScoreKey = 'checkmateGeminiHighScore';
    }
    
    getHighScore() {
        try {
            const score = localStorage.getItem(this.highScoreKey);
            return score ? parseInt(score, 10) : 0;
        } catch (e) {
            console.warn("Local storage not available", e);
            return 0;
        }
    }
    
    setHighScore(score) {
        try {
            localStorage.setItem(this.highScoreKey, score.toString());
        } catch (e) {
            console.warn("Could not save high score", e);
        }
    }
}
