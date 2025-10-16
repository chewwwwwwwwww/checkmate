# Checkmate - Restroom Spacing Etiquette Game

A strategic restroom management game where players must efficiently assign incoming males to available urinals and cubicles while following proper restroom spacing etiquette and avoiding timeouts.

## 🎮 Game Overview

**"A game on Restroom Spacing Etiquette"**

Checkmate challenges players to manage toilet facilities efficiently by:
- Assigning males to available urinals and cubicles
- Following restroom etiquette (no adjacent urinals!)
- Preventing timeouts (males must be assigned before their patience runs out)
- Earning points for successful urinal assignments
- Managing increasing difficulty with faster spawn rates and facility outages
- Collecting life rewards and managing a 3-life system

## 🚀 Features

### Core Gameplay
- **Strategic Restroom Management**: Balance speed and strategy to maximize your score
- **3-Life System**: Start with 3 lives, lose one for timeouts or adjacency violations
- **Life Rewards**: Collect bonus lives from special facilities (golden indicators)
- **Progressive Difficulty**: Adjustable starting difficulty (1-10) with dynamic scaling
- **Smart Facility Outages**: Strategic out-of-order facilities that increase challenge

### User Experience
- **Fully Responsive Design**: Optimized layouts for mobile (360px+), tablet, and desktop
- **Perfect Mobile Layout**: Centered facilities, compact UI, no overlaps
- **Clickable Title**: Click "CHECKMATE" to return to menu anytime
- **YouTube Integration**: Educational video about restroom spacing etiquette
- **Audio Feedback**: Contextual sounds with mute/unmute toggle
- **High Score System**: Local storage with "New High Score" celebrations

### Technical Excellence
- **Canvas-Based Rendering**: Smooth 60fps gameplay with animations
- **Touch & Mouse Support**: Full input support with proper touch targets (44px+)
- **Keyboard Shortcuts**: Quick facility assignment and game controls
- **Real-time Visual Feedback**: Time bars, facility states, and male positioning
- **Accessibility Features**: Reduced motion support, high contrast, proper ARIA labels

## 🎯 Game Rules

### Scoring System
- **+1 point** for each male successfully assigned to a urinal
- **No points** for cubicle assignments (but they help manage the queue)
- **Life rewards** occasionally appear on facilities (collect for extra lives)

### Life System
- **Start with 3 lives** (displayed as diaper icons in UI)
- **Lose 1 life** for timeouts (male has accident on floor)
- **Lose 1 life** for adjacency violations (placing males in adjacent urinals)
- **Game Over** when all lives are lost
- **Gain lives** by using facilities with life reward indicators

### Restroom Etiquette Rules
1. **No Adjacent Urinals**: Males cannot use urinals next to each other
2. **Cubicles Can Be Adjacent**: Cubicles have privacy, so adjacency is allowed
3. **Timeout Prevention**: Assign males before their patience runs out (12 seconds)

### Difficulty Progression
- **Adjustable Start**: Choose starting difficulty 1-10 before game begins
- **Dynamic Scaling**: Difficulty increases every 10 points
- **Spawn Rate**: Decreases by 150ms per difficulty level (min 800ms)
- **Facility Outages**: Start at difficulty 2, become more frequent
- **Out-of-Order Strategy**: Even urinals prioritized at low difficulty, odd at high difficulty

## 🎮 Controls

### Mouse/Touch Controls
- **Click/Tap** facilities to assign waiting males
- **Click "CHECKMATE"** title to return to menu anytime
- **Click difficulty +/-** buttons to adjust starting difficulty
- **Click sound toggle** (🔊/🔇) to mute/unmute audio
- **Hover** over facilities to see availability and status

### Keyboard Shortcuts
- **1-5 Keys**: Quick assign to urinal by number
- **Spacebar**: Pause/Resume game
- **Escape**: Pause game

### Mobile Optimizations
- **44px minimum touch targets** for accessibility
- **Centered layout** prevents accidental UI panel touches
- **Responsive scaling** for all screen sizes (360px to 1440px+)
- **Gesture prevention** to avoid browser navigation conflicts

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
- **Initial Spawn Rate**: 2 seconds between males (difficulty 1)
- **Male Wait Time**: 12 seconds before timeout
- **Urinal Usage Time**: 4 seconds
- **Cubicle Usage Time**: 10 seconds
- **Minimum Spawn Rate**: 0.8 seconds (maximum difficulty)
- **Lives**: Start with 3, can collect more via life rewards
- **Facility Layout**: 5 urinals, 2 cubicles (optimized for strategy)

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

### Color Scheme & Visual Indicators
- **Urinals**: Blue (available) → Red (occupied) → Gray (out of order)
- **Cubicles**: Green (available) → Orange (occupied) → Gray (out of order)
- **Life Rewards**: Golden indicators on facilities
- **Time Bars**: Green → Yellow → Orange → Red (based on time remaining)
- **Males**: Red stick figures with queue numbers and time bars
- **UI**: Modern gradient design with purple header and white panels

### Responsive Layout System
- **Mobile (< 600px)**: Compact layout, smaller facilities, 140px UI panel
- **Tablet (600-899px)**: Medium layout, balanced spacing, 170px UI panel
- **Desktop (≥ 900px)**: Full layout, optimal spacing, 190px UI panel
- **Perfect Centering**: Labels and facilities always centered regardless of screen size
- **No Overlaps**: UI panel never overlaps with game elements

### Screen Size Support
- **Tested Dimensions**: 360×740 to 1440×1108 and everything in between
- **Touch Targets**: Minimum 44px for accessibility compliance
- **High DPI**: Crisp rendering on retina displays
- **Orientation**: Landscape and portrait support
- **Accessibility**: Reduced motion support, high contrast mode

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
- **Toilet Flush**: Played when males finish using facilities
- **Zipper Sound**: Random chance after facility use
- **Satisfied Sound**: Celebration sound for successful assignments
- **Milestone Audio**: Special sounds every 10 points

### Audio Features
- **Toggle Control**: Mute/unmute with 🔊/🔇 button in header
- **Graceful Fallback**: Synthetic sounds if audio files unavailable
- **No Autoplay Issues**: Respects browser autoplay policies
- **Performance Optimized**: Efficient audio loading and playback
- **Volume Management**: Balanced audio levels, no jarring sounds

## 🏆 High Score System

### Features
- **Local Storage**: Scores saved securely in browser
- **Personal Best**: Track your highest score across sessions
- **New Record Celebration**: "🎉 New High Score! 🎉" with animations
- **Smart Display Logic**: Only shows "New High Score" when actually achieved
- **Always Show Play Again**: Button always visible for easy restart

### Privacy & Security
- **No External Servers**: All data stays on your device
- **Safe Storage**: Proper error handling for localStorage failures
- **No Tracking**: Zero data collection or analytics
- **Persistent**: Scores survive browser restarts and updates

## 🚀 Getting Started

### Quick Start
1. **Open** `index.html` in a modern web browser
2. **Watch** the educational video about restroom spacing (optional)
3. **Set** your starting difficulty (1-10) using the +/- buttons
4. **Click** "START GAME" to begin
5. **Assign** males to facilities by clicking/tapping
6. **Follow** restroom etiquette (no adjacent urinals!)
7. **Collect** life rewards when they appear
8. **Beat** your high score!

### Pro Tips
- **Start with difficulty 1** to learn the mechanics
- **Use cubicles strategically** when urinals are blocked
- **Watch the time bars** - red means urgent!
- **Collect life rewards** to extend your game
- **Click the title** to return to menu anytime

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
    cubicleCount: 2,
    initialSpawnRate: 2000,        // 2 seconds initially
    minSpawnRate: 800,             // 0.8 seconds minimum
    spawnRateDecrease: 150,        // Decrease per difficulty level
    maleWaitTime: 12000,           // 12 seconds patience
    urinalUsageTime: 4000,         // 4 seconds to use urinal
    cubicleUsageTime: 10000,       // 10 seconds to use cubicle
    outOfOrderStartDifficulty: 2,  // When outages begin
    maxOutOfOrderFacilities: 2     // Maximum simultaneous outages
};
```

## 🐛 Known Issues & Limitations

### Minor Issues
- **Audio on Mobile**: Some browsers may require user interaction before playing sounds
- **High Scores**: Performance may degrade with extremely high scores (100+ males)
- **Browser Compatibility**: Requires modern browser with ES6 module support

### Not Issues (By Design)
- **Client-Side Scoring**: High scores can be modified locally (no server validation)
- **No Multiplayer**: Single-player experience focused on personal improvement
- **No Accounts**: No login system - scores are device-specific

## 🔒 Security & Privacy

### Security Features
- **No External Dependencies**: All code runs locally
- **Safe Data Storage**: Only high scores stored in localStorage
- **No User Input**: No forms or text inputs to exploit
- **Content Security**: YouTube embed uses HTTPS with proper sandbox
- **No Tracking**: Zero analytics or data collection

### Privacy Guarantee
- **Local-Only**: All data stays on your device
- **No Servers**: No communication with external servers (except YouTube embed)
- **No Cookies**: No tracking cookies or session management
- **Open Source**: All code is visible and auditable

## 📄 License

This project is open source and available under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🎮 About This Game

### Educational Value
Checkmate teaches important social etiquette through engaging gameplay:
- **Restroom Spacing Rules**: Learn proper urinal etiquette
- **Time Management**: Balance speed with strategy
- **Resource Management**: Optimize facility usage
- **Spatial Awareness**: Understand adjacency rules

### Gameplay Experience
- **Quick Sessions**: 2-5 minute games perfect for breaks
- **Extended Play**: Challenge yourself with 20+ minute sessions
- **Progressive Learning**: Start easy, master advanced strategies
- **Replayability**: Adjustable difficulty and random elements keep it fresh

### Perfect For
- **Casual Gamers**: Easy to learn, hard to master
- **Mobile Gaming**: Optimized for phones and tablets
- **Educational Use**: Teaching etiquette and spatial reasoning
- **Stress Relief**: Satisfying gameplay with clear objectives

## 🏆 Master the Art of Restroom Management!

Can you maintain perfect restroom etiquette while managing an endless stream of visitors? Test your skills, beat your high score, and become the ultimate restroom manager in Checkmate!

---

**Ready to play?** Open `index.html` and start your restroom management journey! 🚽✨