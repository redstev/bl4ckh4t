// Game constants
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
// Juster pathway bredden til at være mere passende
const PATHWAY_WIDTH = Math.min(WIDTH / 8, 100); // Mere kompakt banebredde
const NUM_LANES = 3;
const PLAYABLE_HEIGHT = HEIGHT - 100;
const MAX_LEVEL = 4;
const SPEED_INCREMENT = 0.5;
const BASE_SPEED = 0.5;
const VIRUS_SIZE = 20; // Mindre virus størrelse
const OBSTACLE_HEIGHT = 15; // Mindre forhindringer

// Colors
const COLORS = {
    red: 0xff0000,
    black: 0x000000,
    white: 0xffffff,
    green: 0x00ff00,
    yellow: 0xffff00,
    blue: 0x0088ff,
    magenta: 0xff00ff,
    cyan: 0x00ffff
};

// Level headlines and subheadlines
const LEVEL_HEADLINES = [
    "Infiltration",
    "Propagation",
    "Activation",
    "Persistence"
];

const LEVEL_SUBHEADLINES = [
    ["Phishing Successful", "Exploit Deployed", "Backdoor Installed", "Trojan Delivered"],
    ["Worm Spread", "Network Infected", "Replication Achieved", "Social Engineered"],
    ["Payload Activated", "Virus Executed", "System Destroyed", "Data Encrypted"],
    ["Rootkit Installed", "Stealth Mode Engaged", "Backdoor Maintained", "Autostart Secured"]
];