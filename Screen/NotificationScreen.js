import React, {useEffect, useState, useRef} from 'react';

import {
  ScrollView,
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  StatusBar,
  Linking,
  Text,
  Button,
  Touchableopacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import {
  teleconsultation_handler,
  appointmentbooked_handler,
} from '../Notification.js';

import ReactNativeForegroundService from '@supersami/rn-foreground-service';

import {DeviceEventEmitter} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

var RNFS = require('react-native-fs');

import BackgroundTimer from 'react-native-background-timer';

var acknowledgement, replace_brackets;

let intervalID;

let puburl;

let x = '';

let counter = 0;

import TcpSocket from 'react-native-tcp-socket';

import {useFocusEffect} from '@react-navigation/native';

const NotificationScreen = ({navigation}) => {
  let pressed = false;

  let interval = useRef();

  useFocusEffect(
    React.useCallback(() => {
      onStart();
      const subscription = DeviceEventEmitter.addListener(
        'notificationClickHandle',
        function (e) {
          console.log('json', e);
        },
      );
      return () => {
        onStop();
        subscription.remove();
      };
    }, []),
  );

  const outboxmessage = async () => {
    try {
      var date = new Date().toLocaleString();
      console.log('------------' + date + ' -------------');
      let client = TcpSocket.createConnection(
        {port: 9000, host: 'localhost'},
        () => {
          client.write(
            JSON.stringify({
              query5:
                'SELECT * FROM  outbox  where Message_Status = "n" LIMIT 1;',
            }),
          );
        },
      );

      client.on('data', data => {
        console.log(
          'message was received from outbox database ==>',
          data.toString(),
        );
        let var1 = data.toString();
        let replace = var1.replace('[', '').replace(']', '');
        if (replace) {
          sendmessage(replace);
        } else {
          database_message();
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
    } catch (e) {
      console.log('error: ' + e);
    }
  };

  async function sendmessage(message) {
    const read = await AsyncStorage.getItem('registration');
    let parse = JSON.parse(read);

    let object = JSON.parse(message);
    let msgid = object.Message_Id;

    fetch('https://livefiles.sowcare.net/api/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: message,
    })
      .then(response => response.json())
      .then(data => {
        console.log(
          '====RESPONSE FROM WEBSERVICE FOR OUTBOX MESSAGE SENT===> ',
          data.Result,
        );
        if (data.Result == 'Success') {
          let client = TcpSocket.createConnection(
            {port: 9000, host: 'localhost'},
            () => {
              client.write(
                JSON.stringify({
                  status: 'message sent',
                  messageid: msgid,
                  application: parse.application,
                  key: parse.key,
                  query7: `UPDATE outbox set Message_Status = ?
                    WHERE EXISTS (SELECT 1 FROM client_registration WHERE Application= ? AND key = ?) 
                  AND Message_Id= ?`,
                }),
              );
            },
          );
          client.on('data', data => {
            console.log(
              'message was received from outbox DB after updating status ==>',
              data.toString(),
            );
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
        }
        if (data.Result == 'Same Message Id') {
          let client = TcpSocket.createConnection(
            {port: 9000, host: 'localhost'},
            () => {
              client.write(
                JSON.stringify({
                  status: 'Same Message id',
                  messageid: msgid,
                  application: parse.application,
                  key: parse.key,
                  query7: `UPDATE outbox set Message_Status = ?
                    WHERE EXISTS (SELECT 1 FROM client_registration WHERE Application= ? AND key = ?) 
                  AND Message_Id= ?`,
                }),
              );
            },
          );
          client.on('data', data => {
            console.log(
              'message was received from outbox updation ==>',
              data.toString(),
            );
          });
          client.end();
          client.on('error', error => {
            console.log(error);
            client.end();
          });
          client.on('close', () => {
            console.log('Connection closed!');
            client.end();
          });
        }
      });
    database_message();
  }
  const database_message = async () => {
    try {
      var date = new Date().toLocaleString();
      console.log('------------' + date + ' -------------');
      let client = TcpSocket.createConnection(
        {port: 9000, host: 'localhost'},
        () => {
          client.write(
            JSON.stringify({
              query5: 'SELECT * FROM user_registration',
            }),
          );
        },
      );
      client.on('data', data => {
        console.log(
          'message was received from user_registration database ==>',
          data.toString(),
        );
        if (data.toString()) {
          let puburl = JSON.parse(data.toString());
          if (counter === puburl.length) counter = 0;
          const index = counter++ % puburl.length;
          x = puburl[index].Pub_Sub_Id;
          console.log('value of id >>', x);
          webservice_message(x);
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
    } catch (e) {
      console.log('error: ' + e);
    }
  };

  const onStart = () => {
    // Checking if the task i am going to create already exist and running, which means that the foreground is also running.
    if (ReactNativeForegroundService.is_task_running()) {
      return;
    }
    // Creating a task.
    ReactNativeForegroundService.add_task(() => outboxmessage(), {
      delay: 100000,
      onLoop: true,
      taskId: '02',
      onError: e => console.log(`Error logging:`, e),
    });
    // starting  foreground service.
    return ReactNativeForegroundService.start({
      id: 14,
      title: 'client2',
      message: 'your app is running',
    });
  };

  const onStop = () => {
    // Make always sure to remove the task before stoping the service. and instead of re-adding the task you can always update the task.
    if (ReactNativeForegroundService.is_task_running('02')) {
      ReactNativeForegroundService.remove_task('02');
    }
    // Stoping Foreground service.
    return ReactNativeForegroundService.stop({id: 14});
  };

  async function webservice_message(x) {
    console.log('----------');
    const read1 = await AsyncStorage.getItem('registration');
    let parse1 = JSON.parse(read1);

    let url_poll = 'https://livefiles.sowcare.net/api/message/Careplex/' + x;
    console.log('polling url---->>', url_poll);
    fetch(url_poll, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
        console.log('====DATA From Webservice ===> ', data);
        let data1 = JSON.stringify(data);
        replace_brackets = data1.replace('[', ' ').replace(']', '');
        let localvar = JSON.parse(replace_brackets);

        if (localvar.MessageText) {
          let client = TcpSocket.createConnection(
            {port: 9000, host: 'localhost'},
            () => {
              client.write(
                JSON.stringify({
                  EventSourceApplication: localvar.EventSourceApplication,
                  EventName: localvar.EventName,
                  MessageId: localvar.MessageId,
                  MessageText: localvar.MessageText,
                  SubscriberId: localvar.SubscriberId,
                  MessageStatus: localvar.MessageStatus,
                  application: parse1.application,
                  key: parse1.key,
                  response: 'null',
                  // query6: `INSERT INTO inbox(EventSourceApplication,EventName,MessageId ,MessageText,SubscriberId,MessageStatus,response)
                  //   VALUES (?,?,?,?,?,?,?) ON CONFLICT(MessageId)
                  //   DO UPDATE SET EventSourceApplication = EXCLUDED.EventSourceApplication, EventName = EXCLUDED.EventName,
                  //   MessageText=EXCLUDED.MessageText,SubscriberId=Excluded.SubscriberId,MessageStatus=Excluded.MessageStatus,response=Excluded.response;`,
                  query6: `INSERT INTO inbox(EventSourceApplication,EventName,MessageId ,MessageText,SubscriberId,MessageStatus,response) 
                    SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM client_registration WHERE Application= ? AND key = ?)
                     ON CONFLICT(MessageId) 
                    DO UPDATE SET EventSourceApplication = EXCLUDED.EventSourceApplication, EventName = EXCLUDED.EventName,
                    MessageText=EXCLUDED.MessageText,SubscriberId=Excluded.SubscriberId,MessageStatus=Excluded.MessageStatus,response=Excluded.response;`,
                }),
              );
            },
          );
          client.on('data', data => {
            console.log(
              'message was received from INBOX TABLE ==>',
              data.toString(),
            );
            if (data.toString() == 'new message stored') {
              let acknowledgement = JSON.stringify({
                ack: {
                  UserId: localvar.SubscriberId,
                  EventId: localvar.MessageId,
                  EventName: localvar.EventName,
                  EventStatus: 'message recieved',
                },
              });
              sendacknowledgement(x, acknowledgement);
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
        }
      })
      .catch(err =>
        console.log('ERROR during polling for messages ===> ', err),
      );
  }
  function sendacknowledgement(x, acknowledgement) {
    console.log('acknowledgement===>', acknowledgement);

    let url_ack = 'https://livefiles.sowcare.net/api/message/' + x;
    console.log('ack url  =>', url_ack);
    fetch(url_ack, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },

      body: acknowledgement,
    })
      .then(response => response.json())
      .then(data => console.log('ACK Response: ', data))
      .catch(err =>
        console.log('ERROR DURING SENDING ACKNOWLEDGEMENT ===> ', err),
      );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>client 1 for storing messages into DB</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e58',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    backgroundColor: '#1b262c',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    textAlign: 'center',
    color: '#00b7c2',
    marginVertical: 15,
    marginHorizontal: 5,
  },
  actionButton: {
    marginLeft: 5,
  },
  seasonName: {
    color: '#fdcb9e',
    textAlign: 'justify',
  },
  listItem: {
    marginLeft: 0,
    marginBottom: 20,
  },
  activityIndicator: {
    alignItems: 'center',
    height: 80,
  },
});

export default NotificationScreen;
