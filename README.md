# Ginjake MixDeck

VJ video player controlled by DDJ400 MIDI controller and keyboard

## Features

- 🎵 DDJ400 MIDI controller support
- ⌨️ Keyboard control
- 📱 Drag & drop video/image files
- 💾 Auto-save playlist
- 🖥️ OBS compatible
- 🎯 Click-to-seek on progress bar

## Installation

### Prerequisites
- Node.js (v14 or higher)
- DDJ400 MIDI controller (optional)
- DDJ400 drivers installed

### Setup
```bash
# Clone the repository
git clone https://github.com/ginjake/ginjake-mixdeck.git
cd ginjake-mixdeck

# Install dependencies
npm install
```

## Usage

### Browser Version
```bash
npm start
```
Open http://localhost:3000 in your browser

### Electron App
```bash
npx electron .
```

## Controls

### DDJ400 MIDI Controller
**Press the SAMPLER button first**, then use the 8 buttons on the bottom right of the right deck:

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Play/Pause  │ Skip +3s    │ Skip +30s   │ Previous    │
├─────────────┼─────────────┼─────────────┼─────────────┤
│    (none)   │ Skip -3s    │ Skip -30s   │    Next     │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Keyboard Controls
- `←` Left Arrow: Previous video
- `→` Right Arrow: Next video  
- `Space`: Play/Pause

### Mouse Controls
- Drag & drop videos/images to add to playlist
- Click on progress bar to seek
- Click playlist items to select
- Click "削除" button to remove from playlist

## File Support
- Video files: MP4, AVI, MOV, etc.
- Image files: JPG, PNG, GIF, etc.

## Playlist
- Automatically saves playlist on changes
- Restores playlist on app restart
- Click playlist items to switch videos
- Delete button to remove items

## Troubleshooting

### MIDI Not Working
1. Ensure DDJ400 is connected via USB
2. Install DDJ400 drivers
3. Power on DDJ400
4. Check MIDI status in the app (shows connection status)

### Electron Version
MIDI logs are output to PowerShell console for debugging.

## Development

### Build for Production
```bash
npm run build
npm run electron-pack
```

### Project Structure
```
├── public/
│   ├── electron.js     # Electron main process
│   ├── preload.js      # Electron preload script
│   └── index.html      # HTML template
├── src/
│   └── App.js          # Main React component
└── package.json        # Dependencies and scripts
```

## License

MIT License

## Author

ginjake

---

**Note**: This app is designed for VJ performances and works best with the DDJ400 MIDI controller for hands-free operation during live shows.