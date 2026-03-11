# Checkmate Game Assets

This folder contains the audio and image files used in the Checkmate toilet management game.

## Audio Files

### toilet-flushing.mp3
- **Usage**: Played whenever a male finishes using a urinal or cubicle
- **Frequency**: 100% of the time (always plays)
- **Trigger**: Automatic when facility usage completes
- **Timing**: Plays immediately, or 600ms after zipper sound

### zipper.mp3
- **Usage**: Played before toilet flush for urinals (simulates zipping pants)
- **Frequency**: 30% chance for urinal use
- **Trigger**: Automatic when urinal is released
- **Timing**: Plays FIRST, then toilet flush follows 600ms later

### satisfied-man.mp3
- **Usage**: Played after facility use (satisfied sigh)
- **Frequency**: 30% chance after any facility use
- **Trigger**: Automatic after flush sounds complete
- **Timing**: Plays 1500ms after initial sound

## Image Files

### skibidi.png
- **Usage**: Displayed on out-of-order facilities
- **Trigger**: Appears at Difficulty 3+ when facilities go out of order
- **Display**: Centered on facility with red overlay and X mark
- **Duration**: 20-40 seconds before facility is restored

## Audio Sequence

**Urinal with zipper (30% chance):**
1. Zipper sound (0ms)
2. Toilet flush (600ms)
3. Satisfied sound (1500ms) - 30% chance

**Urinal without zipper (70% chance):**
1. Toilet flush (0ms)
2. Satisfied sound (1500ms) - 30% chance

**Cubicle:**
1. Toilet flush (0ms)
2. Satisfied sound (1500ms) - 30% chance

## File Formats

- Audio: MP3 format for broad browser compatibility
- Images: PNG format with transparency support
