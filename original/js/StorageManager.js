/**
 * StorageManager - Handle local storage operations for high score persistence
 * Provides safe local storage operations with graceful fallback
 */

export class StorageManager {
    constructor() {
        this.storageKey = 'checkmate_high_score';
        this.storageAvailable = this.isLocalStorageAvailable();
        
        if (!this.storageAvailable) {
            console.warn('Local storage not available. High scores will not persist.');
        }
    }
    
    /**
     * Check if local storage is available
     */
    isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            window.localStorage.setItem(test, test);
            window.localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('Local storage check failed:', error);
            return false;
        }
    }
    
    /**
     * Safe local storage operation wrapper
     */
    safeLocalStorageOperation(operation, key, value = null) {
        if (!this.storageAvailable) {
            return null;
        }
        
        try {
            switch (operation) {
                case 'get':
                    return window.localStorage.getItem(key);
                case 'set':
                    window.localStorage.setItem(key, value);
                    return true;
                case 'remove':
                    window.localStorage.removeItem(key);
                    return true;
                default:
                    return null;
            }
        } catch (error) {
            console.warn(`Local storage ${operation} operation failed:`, error);
            return null;
        }
    }
    
    /**
     * Get high score from local storage
     */
    getHighScore() {
        const stored = this.safeLocalStorageOperation('get', this.storageKey);
        
        if (stored === null) {
            return 0;
        }
        
        const parsed = parseInt(stored, 10);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    /**
     * Set high score in local storage
     */
    setHighScore(score) {
        if (typeof score !== 'number' || score < 0) {
            console.warn('Invalid score value:', score);
            return false;
        }
        
        const result = this.safeLocalStorageOperation('set', this.storageKey, score.toString());
        return result !== null;
    }
    
    /**
     * Clear high score
     */
    clearHighScore() {
        return this.safeLocalStorageOperation('remove', this.storageKey) !== null;
    }
    
    /**
     * Save additional game data (for future use)
     */
    saveGameData(key, data) {
        try {
            const jsonData = JSON.stringify(data);
            return this.safeLocalStorageOperation('set', `checkmate_${key}`, jsonData) !== null;
        } catch (error) {
            console.warn('Failed to save game data:', error);
            return false;
        }
    }
    
    /**
     * Load additional game data (for future use)
     */
    loadGameData(key) {
        try {
            const jsonData = this.safeLocalStorageOperation('get', `checkmate_${key}`);
            return jsonData ? JSON.parse(jsonData) : null;
        } catch (error) {
            console.warn('Failed to load game data:', error);
            return null;
        }
    }
    
    /**
     * Clear all game data
     */
    clearGameData() {
        if (!this.storageAvailable) {
            return false;
        }
        
        try {
            // Clear all checkmate-related keys
            const keys = Object.keys(window.localStorage);
            keys.forEach(key => {
                if (key.startsWith('checkmate_')) {
                    window.localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.warn('Failed to clear game data:', error);
            return false;
        }
    }
}
