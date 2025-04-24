# Quadrant Shader Camera

An interactive WebGL-based camera effect that splits the view into quadrants and applies various shader effects. This project combines real-time video processing with customizable visual effects.

<img width="920" alt="image" src="https://github.com/user-attachments/assets/3f615334-62a7-4d1b-90b1-6483cc8ac45a" />


## Features

- **Quadrant-Based Processing**: Splits the view into four distinct quadrants
- **Multiple Effects**:
  - Wave distortion
  - Glitch effect
  - Audio-reactive zoom
  - Quadrant expansion/contraction
  - Different blend modes between quadrants
- **Audio Reactivity**: Effects can respond to audio input levels
- **Real-time Controls**: Interactive controls for adjusting effect parameters

## Prerequisites

- A web browser with WebGL support
- [GLSLViewer](https://github.com/patriciogonzalezvivo/glslViewer) (optional, for shader development)
  ```bash
  brew install glslviewer  # On macOS
  ```

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install -g browser-sync
   ```
3. Start the development server:
   ```bash
   browser-sync start --config bs-config.js
   ```
   This will automatically watch for changes in your HTML, CSS, and JS files.

## Usage

- Allow camera access when prompted
- Use the on-screen controls to:
  - Toggle different effects
  - Adjust effect parameters
  - Switch between blend modes
  - Control quadrant expansion

## Development

- The main shader code is in `shader.frag`
- For shader development, you can use GLSLViewer to test shader changes:
  ```bash
  glslviewer shader.frag
  ```

## Technical Details

The project uses:
- WebGL for shader processing
- HTML5 WebCam API
- Fragment shaders for real-time video effects
- Web Audio API for audio input processing
- BrowserSync for development server

## License

MIT 
