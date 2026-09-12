import { registerRootComponent } from 'expo';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

// App.js (and everything it imports, e.g. Firebase config) is required
// LAZILY inside this component's render, wrapped in a plain try/catch.
// A crash while evaluating App.js or any of its imports — the exact kind
// of error that otherwise happens before React has rendered anything and
// silently closes the app with no error screen — is caught here and shown
// as readable text on the device instead, so a real device (not just a
// dev machine) can show you exactly what broke.
function Root() {
  try {
    const App = require('./App').default;
    return <App />;
  } catch (error) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0A0A0A' }}
        contentContainerStyle={{ padding: 20, paddingTop: 60 }}
      >
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
          Startup error
        </Text>
        <Text style={{ color: '#ff6b6b', fontSize: 14, marginBottom: 16 }}>
          {String(error && error.message ? error.message : error)}
        </Text>
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 16 }} />
        <Text style={{ color: '#888', fontSize: 11 }}>
          {String(error && error.stack ? error.stack : 'No stack trace available.')}
        </Text>
      </ScrollView>
    );
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately.
registerRootComponent(Root);
