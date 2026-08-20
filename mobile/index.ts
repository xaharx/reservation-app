import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';
import { registerBackgroundHandler } from './src/notifications/push';

// Must run before registerRootComponent, outside the React tree — this is
// what Firebase requires for background/quit-state push notifications.
registerBackgroundHandler();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
