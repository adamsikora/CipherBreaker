import { registerSW } from 'virtual:pwa-register';
import './style.css';
import { startRouter, Tool } from './shell/router';
import { toast } from './shell/toast';
import { aboutTool } from './tools/about';
import { azimuthTool } from './tools/azimuth';
import { calendarTool } from './tools/calendar';
import { dictionaryTool } from './tools/dictionary';
import { grilleTool } from './tools/grille';
import { menuTool } from './tools/menu';
import { numberAnalyzerTool } from './tools/number-analyzer';
import { playfairTool } from './tools/playfair';
import { binaryReaderTool, ternaryReaderTool } from './tools/readers';

// Tools in the order of the app's menu; the ones not ported yet are listed without mount
const tools: Tool[] = [
  dictionaryTool,
  binaryReaderTool,
  ternaryReaderTool,
  grilleTool,
  azimuthTool,
  calendarTool,
  numberAnalyzerTool,
  playfairTool,
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
