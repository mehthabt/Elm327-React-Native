// @flow

import React, {Component} from 'react';
import { Image } from 'react-native';
import {connect as reduxConnect} from 'react-redux';
import { BleManager } from 'react-native-ble-plx';
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
    return (<View />);
  }
  else {
    return (
    <View style={{flex: 2, paddingTop: 400}} >
    { devicesToList.map( (item,i) => <Text key={i} style={styles.productTextStyle} numberOfLines={1}>{item.name} {item.rssi}</Text>)}
    </View>
  );
  }
};

const ProductWithinRange = function(props) {
  const {device, ...restProps} = props;

  if (device !== undefined && Number(device.rssi) >= RSSI_THRESHHOLD)
  {
    if (device.name === 'BlueUp-01-024238') {
         return(<View><ProductOne/></View>);
    }
    else if (device.name === 'BlueUp-02-025476') {
        return(<View><ProductTwo/></View>);
    }
  } else
  {
    return (<View><IdleView/></View>);
  }
};


const IdleView = function(props) {
    return (
    <View style={{flex: 1, paddingTop: 100}}>
    <Image
        style={styles.tinyLogo}
        source={require('./static/thomsen_logo.jpg')}
        />
    <View style={{flex: 2, paddingTop: 20}} />
      <Text style={styles.productTextStyle} numberOfLines={2}>
          Närma dig en monter för att få mer information.
        </Text>
    </View>
  );
};

const ProductOne = function(props) {
  return (
    <View style={{flex: 1, paddingTop: 100}}>
    <Image
        style={styles.tinyLogo}
        source={require('./static/lars_wallin_logo.jpg')}
        />
    <View style={{flex: 2, paddingTop: 20}} />
      <Text style={styles.productTextStyle} numberOfLines={1}>
          Lars Wallin.
        </Text>
        <Text style={styles.productDescriptionStyle} >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ac viverra augue, sit amet commodo nulla. Proin risus arcu, elementum id elit vel, pellentesque iaculis nibh. Cras et mauris rutrum, condimentum sem in, molestie tortor. Sed non laoreet lectus, eget aliquam ex. Integer varius, elit vel auctor pulvinar, tortor quam semper diam, vehicula mattis odio sem vel ex. Etiam eros urna, mattis egestas finibus volutpat, porttitor ullamcorper est. Donec faucibus neque massa, condimentum fermentum nulla scelerisque vel. Etiam lacus erat, tristique vitae tristique a, eleifend at odio. Nam consequat est gravida, ultricies ante a, hendrerit orci. Nulla faucibus lectus ipsum, in aliquet eros varius non.
        </Text>
    </View>
  );
};

const ProductTwo = function(props) {

  return (
    <View style={{flex: 1, paddingTop: 100}}>
    <Image
        style={styles.tinyLogo}
        source={require('./static/tatiana_faberge_logo.png')}
        />
    <View style={{flex: 2, paddingTop: 20}} />
      <Text style={styles.productTextStyle} numberOfLines={1}>
          Tatiana Fabege.
        </Text>
        <Text style={styles.productDescriptionStyle} >
          Morbi nec placerat felis, scelerisque dignissim arcu. Nulla tempor ante ac erat dignissim, vitae maximus lorem mattis. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Pellentesque ut hendrerit ipsum. Nam accumsan malesuada sem, vitae blandit est egestas non. Integer ac odio in augue sagittis varius. Etiam sagittis ullamcorper velit ut lacinia. Fusce ut felis vitae orci pulvinar congue. Vivamus cursus ligula in dolor iaculis, pharetra ultrices ex pulvinar. Sed maximus fringilla turpis eu congue. Duis a vehicula mauris, nec pulvinar diam.
        </Text>
    </View>
  );
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

export default class ThomsenBeaconProductDisplay extends Component {
  constructor(props: Props) {
    super(props);
    this.manager = new BleManager()
    this.state = {info: "", values: {}}
    this.prefixUUID = "f000aa"
    this.suffixUUID = "-0451-4000-b000-000000000000"
    this.devices = [{}];
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
    this.setState({values: {...this.state.values, [key]: value}})
  }

  sensorTagRSSI(): string {
    if (this.props.sensorTag) {
          return 'RSSI: ' + this.props.sensorTag.rssi;
        }
  }

 componentDidMount() {
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

          switch(device.name) {
            case 'BlueUp-01-024238':
               tmpDevice ={ name:device.name,
                         rssi:device.rssi,
                       };
              break;
            case 'BlueUp-02-025476':
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
            }
          }
        }
        //this.manager.stopDeviceScan()
      }
    });
  }


  sensorTagProductNumber(): string {
    if (this.props.sensorTag != null && this.props.sensorTag.localName === 'BlueUp-01-024238') {
          return 'Product One';
        }

    if (this.props.sensorTag != null && this.props.sensorTag.rssi < RSSI_THRESHHOLD && this.props.sensorTag.localName === 'BlueUp-02-025476') {
          return 'Product Two';
        }
  }

  getProductWithinRange(): boolean {
    return (this.props.sensorTag != null  && this.props.sensorTag.rssi > RSSI_THRESHHOLD && this.props.sensorTag.localName === 'BlueUp-01-024238');
  }

  isProductTwo(): boolean {
    return (this.props.sensorTag != null  && this.props.sensorTag.rssi > RSSI_THRESHHOLD && this.props.sensorTag.localName === 'BlueUp-02-025476');
  }

  isNoProduct(): boolean {
    return (this.props.sensorTag == null ||  this.props.sensorTag.rssi < RSSI_THRESHHOLD || (this.props.sensorTag.localName != 'BlueUp-01-024238' && this.props.sensorTag.localName != 'BlueUp-02-025476') );
  }


  renderHeader() {
    return (
      <View style={{padding: 10}}>

        <ProductWithinRange device={this.getDeviceWithHighestRSSI(this.state.devices)} />

        <ListDevices devicesToList = {this.state.devices} />
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
    backgroundColor: '#000000',
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