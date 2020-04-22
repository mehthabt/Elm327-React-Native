// @flow

import React, {Component} from 'react';
import { Image } from 'react-native';
import {connect as reduxConnect} from 'react-redux';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from "buffer";

import {
  Platform,
  StyleSheet,
  Text,
  SafeAreaView,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  StatusBar,
} from 'react-native';

import {Device} from 'react-native-ble-plx';
import {SensorTagTests, type SensorTagTestMetadata} from './Tests';

const Button = function(props) {
  const {onPress, title, ...restProps} = props;
  return (
    <TouchableOpacity onPress={onPress} {...restProps}>
      <Text
        style={[
          styles.buttonStyle,
          restProps.disabled ? styles.disabledButtonStyle : null,
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};



const RSSI_THRESHHOLD = -55;

const ListDevices = function(props) {
  const {devicesToList, ...restProps} = props;

  if (devicesToList === undefined)
  {
    return (<View {...restProps}>
    <Text style={styles.productTextStyle}>No Device</Text>
    </View>);
  }
  else {
    return (
    <View {...restProps} >
    { devicesToList.map( (item,i) => <Text key={i} style={styles.productTextStyle} numberOfLines={1}>{item.name} {item.rssi}</Text>)}
    </View>
  );
  }
};

const ListData = function(props) {
  const {dataToList, ...restProps} = props;

  if (dataToList === undefined || dataToList.length === 0)
  {
    return (<View {...restProps}>
    <Text style={styles.productTextStyle} >No Data</Text>
    </View>);
  }
  else {
    return (
    <View {...restProps} >
    { dataToList.map( (item,i) => <Text key={i} style={styles.productTextStyle} numberOfLines={1}>{item}</Text>)}
    </View>
  );
  }
};

const ListUartTraffic = function(props) {
  const {messagesToList, ...restProps} = props;

  if (messagesToList === undefined)
  {
    return (<View> <Text>nada </Text> </View> );
  }
  else {
    return (
    <View style={{flex: 2, paddingTop: 400}} >
    { messagesToList.map( (message,i) => <Text key={i} style={styles.productTextStyle} numberOfLines={1}>{message}</Text>)}
    </View>
  );
  }
};


const DisplayInfo = function(props) {
  const {infoString, ...restProps} = props;

  if (infoString === undefined)
  {
    return (<View />);
  }
  else {
    return (
    <View style={{flex: 2, paddingTop: 200}} >
      <Text style={styles.productTextStyle} numberOfLines={1}>{infoString}</Text>
    </View>
  );
  }
};


type Props = {
  sensorTag: ?Device,
  connectionState: $Keys<typeof ConnectionState>,
  logs: Array<string>,
  clearLogs: typeof clearLogs,
  refresh: typeof refresh,
  connect: typeof connect,
  disconnect: typeof disconnect,
  executeTest: typeof executeTest,
  currentTest: ?string,
  forgetSensorTag: typeof forgetSensorTag,
};

type State = {
  showModal: boolean,
};

const uartServiceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const uartTXCharacteristicUUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const uartRXCharacteristicUUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

const loginStringBytes = Buffer.from("L=admin", "base64");



export default class NrfUartTest extends Component {
  constructor(props: Props) {
    super(props);
    this.manager = new BleManager()
    this.state = {info: "", values: {}}
    this.devices = [{}];
    this.device = null;
    this.uartMessages = [];
    this.fifo = [];
    this.fifoSizeLimit = 3;

    this.sendUart = this.sendUart.bind(this)
  }

  fifoInit(size)
  {
    this.fifo = [];
    this.fifoSizeLimit = size;
  }

  fifoPushItem(item)
  {
    if(this.fifo.length >= this.fifoSizeLimit) 
    {
      this.fifo.shift();
    }

    this.fifo.push(item);
  }

  fifoGetItems()
  {
    return this.fifo;
  }

  checkIfDeviceExists (devices, device) {

      var deviceExists = false;

      if (devices === undefined) 
      {
        return false;
      }

      devices.forEach(element => {
        if (element.name === device.name) 
        {
          deviceExists = true;
        }
      });
      return deviceExists;
  } 

  getDeviceWithHighestRSSI (devices) {

      if (devices === undefined) 
      {
        return undefined;
      }

      var lastRSSI = -999;
      var tempDevice = {};

      devices.forEach(element => {
        if (element.rssi > lastRSSI) 
        {
          lastRSSI = element.rssi;
          tempDevice = {... element };
        }
      });
      return tempDevice;
  } 

  updateDevices (devices, device) {

      var tmpDevices = [];
      tmpDevices = devices;

      tmpDevices.forEach(element => {
        if (element.name === device.name) 
        {
          element.rssi = device.rssi;
        }
      });
      return tmpDevices;
  }

  info(message) {
    this.setState({info: message})
  }

  error(message) {
    this.setState({info: "ERROR: " + message})
  }

  updateValue(key, value) {
    const readebleData = Buffer.from(value, 'base64').toString('ascii');
    console.log("received value:", readebleData);
    this.fifoPushItem(readebleData);
    this.setState({values: {...this.state.values, [key]: value}})
  }

  updateDevice(device) {
    this.setState({device: device});
  }

  serviceUUID(num) {
    return this.prefixUUID + num + "0" + this.suffixUUID
  }

  notifyUUID(num) {
    return this.prefixUUID + num + "1" + this.suffixUUID
  }

  writeUUID(num) {
    return this.prefixUUID + num + "2" + this.suffixUUID
  }

  async testFifo() {

    console.log("test fifo");


    console.log("test fifo");
    this.fifoPushItem(1);
    this.fifoPushItem(2);
    this.fifoPushItem(3);
    var items = fifoGetItems();
    console.log("should be 1,2,3",items);
    this.fifoPushItem(4);
    items = fifoGetItems();
    console.log("should be 2,3,4",items);

  }

  listUartData() {
    var items = this.fifoGetItems();

    if (items !== undefined) 
    {
      return items;
    }
    else {
      return [];
    }
  }


  async sendUart() {

    if(this.device === null)
      return;

    console.log('loginDevice')

    const loginBytes = Buffer.from("L=admin").toString('base64');
    console.log("loginData",loginBytes);

    this.manager.writeCharacteristicWithoutResponseForDevice(
      this.device.id,
      uartServiceUUID,
      uartRXCharacteristicUUID,
      loginBytes
    ).then((res) => {
      console.log(`WRITE RES ${res}`)
    }).catch((error) => {
      console.log(`WRITE ERROR ${error}`)
    })
  }

  async setupNotifications(device) {


      device.monitorCharacteristicForService(
        uartServiceUUID,
        uartTXCharacteristicUUID,
        (error, characteristic) => {
        if (error) {
          console.log("error",error.message);
          this.error(error.message)
          return
        }
        console.log("received tx value");
        this.updateValue(characteristic.uuid, characteristic.value)
      })
  } 

 componentDidMount() {

    this.fifoInit(4);

    if (Platform.OS === 'ios') {
      this.manager.onStateChange((state) => {
        if (state === 'PoweredOn')
          {
            this.scanAndConnect()
          } 
      })
    } else {
      this.scanAndConnect()
    }
  }

  scanAndConnect() {
    this.manager.startDeviceScan(null,
                                 null, (error, device) => {
      this.info("Scanning...")
      //console.log(device)

      if (error) {
        this.error(error.message)
        return
      }

      //scannedDevice.rssi > RSSI_THRESHHOLD

      if (device != null)  {
        if (device.name != null) 
        {

          var infoString = "a";
          var tmpDevice = null;

          //console.log(device.name);

          switch(device.name) {
            case 'ECU_BLE_BRIDGE':
               tmpDevice ={ name:device.name,
                         rssi:device.rssi,
                       };
              break;
            default:
              infoString = "not recognised";
          }

          this.info(infoString)

          if (tmpDevice !== null) 
          {
            var devices = this.state.devices;
            if (devices === undefined) 
            {
              devices = [];
            }

            var deviceExists = this.checkIfDeviceExists(devices, tmpDevice);

            if (deviceExists) 
            {
              var devices = this.updateDevices(devices, tmpDevice);
              this.setState({devices: devices})
            }
            else 
            {
              devices.push(tmpDevice);
              this.setState({devices: devices})

              // stopping scan here
              this.manager.stopDeviceScan()

              this.device = device;

              device.connect()
              .then((device) => {
                console.log('discovering')
                this.info("Discovering services and characteristics")
                return device.discoverAllServicesAndCharacteristics()
              })
              .then((device) => {
                console.log('Setting notification')
                this.info("Setting notifications")
                return this.setupNotifications(device)
              })
              .then(() => {
                console.log('Listening...')
                this.info("Listening...")
              }, (error) => {
                this.error(error.message)
              }) 
              .then((dev) => {
                console.log("success to connect")
              })
              .catch((error) => {
                console.log("connect error:" + error)
              });


            }
          }

        }
        
      }
    });
  }

  renderHeader() {
    return (
      <View style={{padding: 10}}>
        <Button 
        style={{marginTop: 50}}
        onPress={() => {
            this.testFifo();
          }}
        title={'Try send uart'}
        />
        <DisplayInfo info = {this.state.info} />
        <Text> {this.device != null ? this.device.name : "noo"}</Text>

        <ListDevices  style={{marginTop: 50}} devicesToList = {this.state.devices} />
        <ListData style={{marginTop: 150}} dataToList = {this.fifoGetItems()} />

      </View>
    );
  }

  render() {
    return (
        <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#5a070f" />
        {this.renderHeader()}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6e6e6e',
    padding: 5,
  },
  textStyle: {
    color: 'white',
    fontSize: 20,
  },
  logTextStyle: {
    color: 'white',
    fontSize: 9,
  },
  productTextStyle: {
    color: 'white',
    width: 250,
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 20,
  },
  productDescriptionStyle: {
    color: 'white',
    width: 250,
    paddingTop: 10,
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 12,
  },
  tinyLogo: {
    alignSelf: 'center',
    width: 70,
    height: 70,
  },
  buttonStyle: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 5,
    backgroundColor: '#af3c46',
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
  },
  disabledButtonStyle: {
    backgroundColor: '#614245',
    color: '#919191',
  },
});