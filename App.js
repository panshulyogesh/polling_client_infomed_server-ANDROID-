import React, {useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  StatusBar,
  Button,
  AppState,
} from 'react-native';

import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

// Import Screens
import SplashScreen from './Screen/SplashScreen';
import NotificationScreen from './Screen/NotificationScreen';

import AppRegistrationScreen from './Screen/AppRegistrationScreen';
const Stack = createStackNavigator();

const App = () => {
  useEffect(() => {
    console.log('----App.js-----');
  }, []);


  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SplashScreen">
        <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="NotificationScreen"
          component={NotificationScreen }
          options={{headerShown: false}}
        />

        <Stack.Screen
          name="AppRegistrationScreen"
          component={AppRegistrationScreen}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
