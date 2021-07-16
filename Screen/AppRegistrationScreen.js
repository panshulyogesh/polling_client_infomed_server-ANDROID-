import React, {useState, useEffect} from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import TcpSocket from 'react-native-tcp-socket';

const AppRegistrationScreen = ({navigation}) => {
  const [app, setapp] = useState('');

  const registration = async () => {
    console.log('----------------');
    const read = await AsyncStorage.getItem('registration');
    if (read == null) {
      let client = TcpSocket.createConnection(
        {port: 9000, host: 'localhost'},
        () => {
          client.write(
            JSON.stringify({
              query1:
                'INSERT INTO client_registration(Application, key) VALUES (?,?)',
              application: app,
            }),
          );
        },
      );
      // client.on('connect', () => {
      //   console.log('Opened [client1] on ' + JSON.stringify(client.address()));
      // });
      await client.on('data', data => {
        console.log('message was received from server ==>', data.toString());
        let parse = JSON.parse(data.toString());
        if (parse.application == app && parse.key) {
          AsyncStorage.setItem('registration', data.toString());
          console.log(parse.application, parse.key);
          Alert.alert(
            'Success',
            'save  this key for future reference' + ':' + parse.key,
            [
              {
                text: 'Ok',
                onPress: () => navigation.navigate('NotificationScreen'),
              },
            ],
            {cancelable: false},
          );
        }

        client.end();
      });
      client.on('error', error => {
        console.log(error);
        client.end();
      });
      client.on('close', () => {
        console.log('Connection closed!');
        client.end();
      });
    } else {
      const read1 = await AsyncStorage.getItem('registration');
      console.log('data stored in Async:-', read1);
      Alert.alert('Application is already registered');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Register Application</Text>
      <View style={styles.SectionStyle}>
        <TextInput
          style={styles.inputStyle}
          onChangeText={key => setapp(key)}
          placeholder="Enter a value to generate key"
          placeholderTextColor="white"
          autoCapitalize="none"
          underlineColorAndroid="#f000"
          blurOnSubmit={false}
        />
      </View>
      <TouchableOpacity
        style={styles.buttonStyle}
        activeOpacity={0.5}
        onPress={registration}>
        <Text style={styles.buttonTextStyle}>REGISTER </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AppRegistrationScreen;

const styles = StyleSheet.create({
  buttonTextStyle: {
    color: '#FFFFFF',
    paddingVertical: 10,
    fontSize: 16,
  },
  buttonStyle: {
    backgroundColor: '#307e',
    borderWidth: 0,
    color: '#FFFFFF',
    borderColor: '#7DE2',
    height: 40,
    alignItems: 'center',
    borderRadius: 30,
    marginLeft: 35,
    marginRight: 35,
    marginTop: 20,
    marginBottom: 25,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#307ecc',
  },
  activityIndicator: {
    alignItems: 'center',
    height: 80,
  },
  inputStyle: {
    flex: 1,
    color: 'white',
    paddingLeft: 15,
    paddingRight: 15,
    borderWidth: 1,
    borderRadius: 30,
    borderColor: '#dadae8',
  },
  heading: {
    textAlign: 'center',
    color: 'white',
    marginVertical: 15,
    marginHorizontal: 5,
  },
  SectionStyle: {
    flexDirection: 'row',
    height: 40,
    marginTop: 20,
    marginLeft: 35,
    marginRight: 35,
    margin: 10,
  },
});
