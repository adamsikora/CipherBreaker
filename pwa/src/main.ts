import { registerSW } from 'virtual:pwa-register';
import './style.css';
import { startRouter, Tool } from './shell/router';
import { toast } from './shell/toast';
import { aboutTool } from './tools/about';
import { dictionaryTool } from './tools/dictionary';
import { menuTool } from './tools/menu';

// Tools in the order of the app's menu; the ones not ported yet are listed without mount
const tools: Tool[] = [
  dictionaryTool,
  { path: 'binary', title: 'Binary Reader', icon: 'two' },
  { path: 'ternary', title: 'Ternary Reader', icon: 'three' },
  { path: 'grille', title: 'Grille Helper', icon: 'grille' },
  { path: 'azimuth', title: 'Azimuth Finder', icon: 'explore' },
  { path: 'calendar', title: 'Name Day Searcher', icon: 'date-range' },
  { path: 'numbers', title: 'Number Analyzer', icon: 'number-analyzer' },
  { path: 'playfair', title: 'Playfair Helper', icon: 'playfair' },
  { path: 'princip', title: 'Princip Trainer', icon: 'school', external: 'https://app.civilizacehra.cz' },
  aboutTool,
];

startRouter(menuTool(tools), tools);

// All the dictionaries are downloaded when the service worker installs, so the app works offline
registerSW({
  immediate: true,
  onOfflineReady() {
    toast('Dictionaries downloaded, the app works offline now');
  },
});
