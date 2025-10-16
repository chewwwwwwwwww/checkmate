# Checkmate - Toilet Management Game

A strategic toilet management game where players must efficiently assign incoming males to available urinals and cubicles while avoiding adjacency violations and timeouts.

## 🎮 Game Overview

Checkmate challenges players to manage a public restroom by:
- Assigning males to available urinals and cubicles
- Avoiding adjacency violations (males can't use adjacent urinals)
- Preventing timeouts (males must be assigned before their patience runs out)
- Earning points for successful urinal assignments
- Managing increasing difficulty with faster spawn rates and facility outages

## 🚀 Features

- **Strategic Gameplay**: Balance speed and strategy to maximize your score
- **Progressive Difficulty**: Game gets harder with increased spawn rates and facility outages
- **Audio Feedback**: Contextual sounds for different actions (flush sounds, milestone celebrations)
- **High Score Tracking**: Personal best scores saved locally
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Touch Support**: Full touch and mouse input support
- **Visual Feedback**: Clear indicators for facility states and time remaining

## 🎯 Game Rules

### Scoring
- **+1 point** for each male successfully assigned to a urinal
- **No points** for cubicle assignments (but they help manage the queue)

### Game Over Conditions
1. **Timeout**: A male waits too long and has an accident on the floor
2. **Adjacency Violation**: Placing males in adjacent urinals (cubicles can be adjacent)

### Difficulty Progression
- **Score 10+**: Faster male spawning
- **Score 15+**: Random facility outages (skibidi toilet effect)
- Spawn rate decreases by 300ms every 10 points (minimum 1.2 seconds)

## 🎮 Controls

### Mouse/Touch
- **Click/Tap** on available facilities to assign waiting males
- **Hover** over facilities to see availability status

### Keyboard
- **Spacebar/Escape**: Pause/Resume game
- **R**: Restart game (when game over)
- **1-5**: Quick assign to urinal by number

## 🏗️ Technical Architecture

### Core Components
- **GameEngine**: Main game loop and state management
- **FacilityManager**: Handles urinals, cubicles, and adjacency rules
- **MaleSpawner**: Manages male spawning and queue system
- **AudioManager**: Contextual sound effects and audio feedback
- **RenderEngine**: Canvas-based rendering with animations
- **InputHandler**: Mouse, touch, and keyboard input processing
- **StorageManager**: Local storage for high scores

### Game Parameters (Tuned for Optimal Experience)
- **Initial Spawn Rate**: 3 seconds between males
- **Male Wait Time**: 12 seconds before timeout
- **Urinal Usage Time**: 4 seconds
- **Cubicle Usage Time**: 10 seconds
- **Minimum Spawn Rate**: 1.2 seconds (maximum difficulty)

## 🧪 Testing

The game includes comprehensive testing:
- **Unit Tests**: Individual component testing
- **Integration Tests**: Cross-component functionality
- **End-to-End Tests**: Complete game session validation
- **Performance Tests**: Frame rate and memory usage optimization

### Running Tests
```bash
cd Checkmate
npm install
npm test
```

### Test Coverage
- GameEngine: State management, scoring, difficulty scaling
- FacilityManager: Assignment rules, adjacency validation, auto-release
- MaleSpawner: Queue management, timeout detection
- AudioManager: Sound loading, contextual audio triggers
- RenderEngine: Canvas rendering, visual feedback
- InputHandler: Input validation, coordinate translation
- StorageManager: High score persistence, error handling

## 🎨 Visual Design

### Color Scheme
- **Urinals**: Blue (available) → Red (occupied) → Gray (out of order)
- **Cubicles**: Green (available) → Orange (occupied) → Gray (out of order)
- **Time Bars**: Green → Yellow → Orange → Red (based on time remaining)
- **UI**: Modern gradient design with high contrast

### Responsive Features
- Scales to different screen sizes
- Touch-friendly interface elements (minimum 44px touch targets)
- High DPI display support
- Landscape orientation support
- Dark mode support

## 🔧 Browser Compatibility

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Required Features
- HTML5 Canvas
- Web Audio API (optional, falls back to synthetic sounds)
- Local Storage (optional, high scores won't persist)
- ES6 Modules

## 📱 Mobile Support

- **Touch Events**: Full touch input support with gesture prevention
- **Responsive Layout**: Adapts to mobile screen sizes
- **Performance Optimized**: Efficient rendering for mobile devices
- **Accessibility**: Reduced motion support, high contrast mode

## 🎵 Audio System

### Sound Effects
- **Urinal Flush**: Played when males finish using urinals
- **Toilet Flush**: Different sound for cubicle completion
- **Zip Sound**: Random chance after urinal use
- **Milestone Sigh**: Celebration sound every 10 points

### Audio Features
- Synthetic sound generation for development
- Volume control and mute functionality
- Graceful fallback when audio is unavailable
- No audio overlap or jarring sounds

## 🏆 High Score System

- **Local Storage**: Scores saved in browser
- **Personal Best**: Track your highest score
- **New Record Celebration**: Special animation for new high scores
- **Persistent**: Scores survive browser restarts
- **Privacy**: No data sent to external servers

## 🚀 Getting Started

1. **Clone or Download** the game files
2. **Open** `index.html` in a modern web browser
3. **Click** "Start Game" to begin
4. **Assign** males to facilities by clicking/tapping
5. **Avoid** adjacency violations and timeouts
6. **Beat** your high score!

## 🔧 Development

### Project Structure
```
Checkmate/
├── index.html          # Main HTML file
├── main.css           # Styles and responsive design
├── main.js            # Game initialization and configuration
├── js/                # Game components
│   ├── GameEngine.js
│   ├── FacilityManager.js
│   ├── MaleSpawner.js
│   ├── AudioManager.js
│   ├── RenderEngine.js
│   ├── InputHandler.js
│   └── StorageManager.js
└── tests/             # Test files
    ├── GameEngine.test.js
    ├── FacilityManager.test.js
    ├── MaleSpawner.test.js
    ├── AudioManager.test.js
    ├── RenderEngine.test.js
    ├── InputHandler.test.js
    ├── ScoringSystem.test.js
    └── EndToEnd.test.js
```

### Configuration
Game parameters can be adjusted in `main.js`:
```javascript
const GAME_CONFIG = {
    urinalCount: 5,
    cubicleCount: 3,
    initialSpawnRate: 3000,
    minSpawnRate: 1200,
    maleWaitTime: 12000,
    // ... other parameters
};
```

## 🐛 Known Issues

- Audio may not work on some mobile browsers due to autoplay restrictions
- High DPI scaling may cause slight visual artifacts on some devices
- Performance may degrade with very high scores (100+ males in queue)

## 📄 License

This project is open source and available under the MIT License.

## 🎮 Have Fun!

Checkmate is designed to be challenging yet fair, with gameplay that can last from quick 2-minute sessions to extended 30+ minute challenges. Master the art of toilet management and see how high you can score!