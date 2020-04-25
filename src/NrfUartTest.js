// @flow

import React, {Component} from 'react';
import { Image } from 'react-native';
import {connect as reduxConnect} from 'react-redux';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from "buffer";

import { Queue } from "./FifoQueue"
import { CircularBuffer } from "./CircularBuffer"

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


const ListDataWithKeys = function(props) {
  const {dataToList, ...restProps} = props;

  if (dataToList === undefined || dataToList.length === 0)
  {
    return (<View {...restProps}>
    <Text style={styles.productTextStyle} >No Data</Text>
    </View>);
  }
  else {

    console.log(dataToList);

    return (
    <View {...restProps} >
    { 
      dataToList.map( (item,i) => <Text key={i} style={styles.productTextStyle} numberOfLines={1}>{item[0]}: {item[1]}</Text>)}
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



const voltageResponse = "V"
const voltageResponseDot = "."

const pidAsk = "01"
const pidResponse = "41"

const pidECT = "AT05";
const pidRPM = "0C";
const pidMAP = "0B";
const pidO2 = "24";

const AT_PID_READ_CLT = "01 05";
const AT_PID_READ_RPM = "01 0C";
const AT_PID_READ_MAP = "01 0B";
const AT_PID_READ_O2 = "01 24";

const AT_CAN_FILTER = "ATCF607";
const AT_CAN_MASK = "ATCM607";
const AT_CAN_RECEIVE = "ATCRA";
const AT_MA = "ATMT 500";
const AT_SET_PROTOCOL_11BIT_500 = "ATSP6";
const AT_SET_PROTOCOL_11BIT_125 = "ATSPB";
const AT_HEADER_ENABLED = "ATH0";
const AT_SPACES_DISABLED = "ATS0";
const AT_FORMATTING_DISABLED = "ATCAF0";

const AT_RESET = "ATWS";

const AT_LINE_FEED = "ATL1";
const AT_TIMEOUT = "ATSTFF";

const ECU_MASTER_CAN_STREAM_ID = "500";

const ECU_MASTER_CAN_STREAM_FILTER = "500";

const ECU_MASTER_CAN_STREAM_MASK = "500";

const elm327ServiceUUID = "000018f0-0000-1000-8000-00805f9b34fb";
const elm327NotifyCharacteristicUUID = "00002af0-0000-1000-8000-00805f9b34fb";
const elm327WriteCharacteristicUUID = "00002af1-0000-1000-8000-00805f9b34fb";

const ELM_327_READ_BATTERY_VOLTAGE = 'RBV';
const ELM_327_READ_PIDS = 'RPD';
const ELM_327_REQUEST_ECUMASTER_CAN_STREAM = "RECS";
const ELM_327_SET_ECUMASTER_CAN_FILTER = "SECF";
const ELM_327_SET_ECUMASTER_CAN_MASK = "SECM";


const ELM_327_SET_ECUMASTER_CAN_STREAM_RECEIVE = "SECR";
const ELM_327_QUEUE_AT_MA = "ATMA"


const ELM_327_STATUS_WAITING = 'WAITING';

const ELM_327_UNABLE_TO_CONNECT = 'UNABLE TO CONNECT';

const ELM_327_STATUS_READ_MULTIPLE_PIDS_REQUEST = 'MULTI_PIDS';

const ELM_327_STATUS_SET_ECU_MASTER_CAN_STREAM_FILTER_REQUEST = "ECU_CAN_REQF";
const ELM_327_STATUS_SET_ECU_MASTER_CAN_STREAM_MASK_REQUEST = "ECU_CAN_REQM";
const ELM_327_STATUS_SET_ECU_MASTER_CAN_STREAM_RECEIVE_REQUEST = "ECU_CAN_REC";
const ELM_327_STATUS_AT_MA_REQUEST = "AT_MA_REQ";

const ELM_327_STATUS_AT_SET_PROTOCOL_REQUEST = "AT_SP_REQ";
const ELM_327_SET_PROTOCOL = "SEP";

const ELM_327_SET_HEADER_ENABLED = "SHE";
const ELM_327_STATUS_AT_SET_HEADER_ENABLED_REQUEST = "AT_SH_EN_REQ";

const ELM_327_SET_FORMATTING_DISABLED = "SFD";
const ELM_327_SET_FORMATTING_DISABLED_REQ = "SFD_REQ";

const ELM_327_SET_LINE_FEED = "SLF";
const ELM_327_SET_LINE_FEED_REQ = "SLF_REQ";

const ELM_327_SET_TIMEOUT = "STIME";
const ELM_327_SET_TIMEOUT_REQ = "STIME_REQ";

const ELM_327_RESET = "RESET";
const ELM_327_RESET_REQ = "RESET_REQ";

const ELM_327_PID_READ_CLT = "R_PID_CLT";
const ELM_327_PID_READ_CLT_REQ = "R_PID_CLT_REQ";

const ELM_327_PID_READ_RPM = "R_PID_RPM";
const ELM_327_PID_READ_RPM_REQ = "R_PID_RPM_REQ";

const ELM_327_PID_READ_MAP = "R_PID_MAP";
const ELM_327_PID_READ_MAP_REQ = "R_PID_MAP_REQ";

const ELM_327_PID_READ_O2 = "R_PID_O2";
const ELM_327_PID_READ_O2_REQ = "R_PID_O2_REQ";


const ELM_327_SET_SPACES_DISABLED = "SSD"
const ELM_327_SET_SPACES_DISABLED_REQ = "SSD_REQ"

const ELM_327_READ_ECU_MASTER_CAN_STREAM_REQUEST = 'READ_CAN_STREAM';

const ELM_327_STATUS_BATTERY_VOLTAGE_REQUEST = 'VOLT_REQ';
const ELM_327_BATTERY_VOLTAGE_REQUEST_RESPONSE_LINES = 2;
const ELM_327_STATUS_BATTERY_VOLTAGE_INDEX = 1;

//  00 00 00 0F 64 00 00 00;

export default class NrfUartTest extends Component {
  constructor(props: Props) {
    super(props);
    this.manager = new BleManager();
    this.device = null;
    this.uartMessages = [];

    this.state = { 
      values: { 
        voltage: "NaN",
        map: "NaN",
        rpm: "NaN",
        lambda: "NaN",
        clt: "NaN"
    }};

    this.logMessageList = new CircularBuffer();
    this.logMessageList.init(5);

    this.processQueue = new Queue();
   // this.processQueue.enqueue(ELM_327_READ_BATTERY_VOLTAGE);
    this.processQueue.enqueue(ELM_327_RESET);
    this.processQueue.enqueue(ELM_327_SET_PROTOCOL);
    this.processQueue.enqueue(ELM_327_PID_READ_CLT);
    this.processQueue.enqueue(ELM_327_PID_READ_RPM);
    this.processQueue.enqueue(ELM_327_PID_READ_MAP);
    this.processQueue.enqueue(ELM_327_PID_READ_O2);

    this.elmDataQueue = new Queue();
    this.elm327Status = ELM_327_STATUS_WAITING;

    this.readBatteryVoltage = this.readBatteryVoltage.bind(this)
  }


  info(message) {
    this.setState({info: message})
  }

  error(message) {
    this.setState({info: "ERROR: " + message})
  }

  async workTheProcessQueue() {

    if (this.elm327Status === ELM_327_STATUS_WAITING) {
          var task = this.processQueue.dequeue();
          if (task === ELM_327_READ_BATTERY_VOLTAGE) {
            this.readBatteryVoltage();
          }
          else if (task === ELM_327_READ_PIDS) {
            console.log('ELM_327_READ_PIDS');
            this.readMultiplePid();
          }
          else if (task === ELM_327_SET_ECUMASTER_CAN_FILTER) {
            console.log('ELM_327_SET_ECUMASTER_CAN_FILTER');
            const atCMD = AT_CAN_FILTER;
            this.writeAtCommand(atCMD, ELM_327_STATUS_SET_ECU_MASTER_CAN_STREAM_FILTER_REQUEST);
          }
          else if (task === ELM_327_SET_ECUMASTER_CAN_MASK) {
            console.log('ELM_327_SET_ECUMASTER_CAN_MASK');
            const atCMD = AT_CAN_MASK;
            this.writeAtCommand(atCMD, ELM_327_STATUS_SET_ECU_MASTER_CAN_STREAM_MASK_REQUEST);
          }
          else if (task === ELM_327_SET_ECUMASTER_CAN_STREAM_RECEIVE) {
            console.log('ELM_327_SET_ECUMASTER_CAN_STREAM_RECEIVE');
            const atCMD = AT_CAN_RECEIVE;
            this.writeAtCommand(atCMD, ELM_327_STATUS_SET_ECU_MASTER_CAN_STREAM_RECEIVE_REQUEST);
          }
          else if(task === ELM_327_QUEUE_AT_MA) {
             this.writeAtCommand(AT_MA, ELM_327_STATUS_AT_MA_REQUEST);
          }
          else if(task === ELM_327_SET_PROTOCOL) {
            console.log('ELM_327_SET_PROTOCOL');
             this.writeAtCommand(AT_SET_PROTOCOL_11BIT_500, ELM_327_STATUS_AT_SET_PROTOCOL_REQUEST);
          }
          else if(task === ELM_327_SET_HEADER_ENABLED) {
            console.log('ELM_327_SET_HEADER_ENABLED');
             this.writeAtCommand(AT_HEADER_ENABLED, ELM_327_STATUS_AT_SET_HEADER_ENABLED_REQUEST);
          }
          else if(task === ELM_327_SET_FORMATTING_DISABLED) {
            console.log('ELM_327_SET_FORMATTING_DISABLED');
            this.writeAtCommand(AT_FORMATTING_DISABLED, ELM_327_SET_FORMATTING_DISABLED_REQ);
          }
          else if(task === ELM_327_SET_LINE_FEED) {
            console.log('ELM_327_SET_LINE_FEED');
            this.writeAtCommand(AT_LINE_FEED, ELM_327_SET_LINE_FEED_REQ);
          }
          else if(task === ELM_327_SET_TIMEOUT) {
            console.log('ELM_327_SET_TIMEOUT');
            this.writeAtCommand(AT_TIMEOUT, ELM_327_SET_TIMEOUT_REQ);
          }
          else if(task === ELM_327_RESET) {
            console.log('ELM_327_RESET');
            this.writeAtCommand(AT_RESET, ELM_327_RESET_REQ);
          }
          else if(task === ELM_327_SET_SPACES_DISABLED) {
            console.log('ELM_327_SET_SPACES_DISABLED');
            this.writeAtCommand(AT_SPACES_DISABLED, ELM_327_SET_SPACES_DISABLED_REQ);
          }
          else if(task === ELM_327_PID_READ_CLT) {
            this.writeAtCommand(AT_PID_READ_CLT, ELM_327_PID_READ_CLT_REQ);
          }
          else if(task === ELM_327_PID_READ_RPM) {
            this.writeAtCommand(AT_PID_READ_RPM, ELM_327_PID_READ_RPM_REQ);
          }
          else if(task === ELM_327_PID_READ_MAP) {
            this.writeAtCommand(AT_PID_READ_MAP, ELM_327_PID_READ_MAP_REQ);
          }
          else if(task === ELM_327_PID_READ_O2) {
            this.writeAtCommand(AT_PID_READ_O2, ELM_327_PID_READ_O2_REQ);
          }
    }
  }

  async writeAtCommand(atCommand, status) {

    const atCommandString = atCommand +"\r";
    const atCommandBytes = Buffer.from(atCommandString).toString('base64');

    this.elm327Status = status;
    this.writeToElm327(atCommandBytes);
  }

  async readEcuMasterCanStream() {
    console.log("readEcuMasterCanStream()");

    const readVoltageBytes = Buffer.from("AT RV\r").toString('base64');

    this.elm327Status = ELM_327_READ_ECU_MASTER_CAN_STREAM_REQUEST;
    this.writeToElm327(readVoltageBytes);
  }

  async readBatteryVoltage() {

    console.log('readBatteryVoltage');

    const readVoltageBytes = Buffer.from("AT RV\r").toString('base64');

    this.elm327Status = ELM_327_STATUS_BATTERY_VOLTAGE_REQUEST;
    this.writeToElm327(readVoltageBytes);
  }

  async readMultiplePid() {
    
    console.log('readMultiplePid');

    var requestString = pidAsk + " " + pidECT + " " + pidRPM + " " + pidMAP + " " + pidO2 +"\r"
    console.log('requestString: ',requestString);

    const readMultiplePidBytes = Buffer.from(requestString).toString('base64');

    this.elm327Status = ELM_327_STATUS_READ_MULTIPLE_PIDS_REQUEST;
    this.writeToElm327(readMultiplePidBytes);
  }

  async readECT() {

    console.log('readECT');

    const readECTBytes = Buffer.from(pidAsk+pidECT+"\r").toString('base64');

    this.writeToElm327(readECTBytes);
  }

  async readMAP() {

    console.log('readMAP');

    const readMAPBytes = Buffer.from(pidAsk+pidMAP+"\r").toString('base64');

    this.writeToElm327(readMAPBytes);
  }

  async readRPM() {

    console.log('readRPM');

    const readRPMBytes = Buffer.from(pidAsk+pidRPM+"\r").toString('base64');

    this.writeToElm327(readRPMBytes);
  }

  async readO2() {

    console.log('readO2');
    const readO2Bytes = Buffer.from(pidAsk+pidO2+"\r").toString('base64');
    console.log("readO2 bytes to send:",readO2Bytes);

    this.writeToElm327(readO2Bytes);
  }

  async writeToElm327(bytesToWrite) {

    if(this.device === null)
      return;

    this.elmDataQueue = new Queue();

    this.manager.writeCharacteristicWithoutResponseForDevice(
      this.device.id,
      elm327ServiceUUID,
      elm327WriteCharacteristicUUID,
      bytesToWrite
    ).then((res) => {
    }).catch((error) => {
    })
  }

  async updateValue(key, value) {
    const readebleData = Buffer.from(value, 'base64').toString('ascii');
    this.handleELM327Data(readebleData);
  }

  async handleELM327Data(value) {
    if (this.elm327Status !== ELM_327_STATUS_AT_MA_REQUEST) {
      this.elmDataQueue.enqueue(value);
    }

    if (this.elm327Status === ELM_327_STATUS_BATTERY_VOLTAGE_REQUEST) {

      if (this.elmDataQueue.size() >= ELM_327_BATTERY_VOLTAGE_REQUEST_RESPONSE_LINES) {
        this.handleELM327ReadVoltageResponse();
      }
    }
    else if (this.elm327Status === ELM_327_STATUS_READ_MULTIPLE_PIDS_REQUEST) {
      if (this.isUnableToConnect()) {
        console.log("unable to connect!");
      }
    }
    else if(this.elm327Status === ELM_327_STATUS_SET_ECU_MASTER_CAN_STREAM_FILTER_REQUEST) {
      if (this.elmDataQueue.size() > 1) {
        console.log("ELM_327_STATUS_SET_ECU_MASTER_CAN_STREAM_FILTER_REQUEST");
        this.handleResponse();
      }
    }
    else if(this.elm327Status === ELM_327_STATUS_SET_ECU_MASTER_CAN_STREAM_MASK_REQUEST) {
      if (this.elmDataQueue.size() > 1) {
        console.log("ELM_327_STATUS_SET_ECU_MASTER_CAN_STREAM_MASK_REQUEST");
        this.handleResponse();
      }
    }
    else if(this.elm327Status === ELM_327_STATUS_SET_ECU_MASTER_CAN_STREAM_RECEIVE_REQUEST) {

      if (this.elmDataQueue.size() > 1) {
        console.log("ELM_327_STATUS_SET_ECU_MASTER_CAN_STREAM_RECEIVE_REQUEST");
        this.handleResponse();
      }
     }
    else if (this.elm327Status === ELM_327_STATUS_AT_SET_PROTOCOL_REQUEST) {
      if (this.elmDataQueue.size() > 1) {
        console.log("ELM_327_STATUS_AT_SET_PROTOCOL_REQUEST");
        this.handleResponse();
      }
    }
    else if (this.elm327Status === ELM_327_STATUS_AT_SET_HEADER_ENABLED_REQUEST) {
      if (this.elmDataQueue.size() > 1) {
        console.log("ELM_327_STATUS_AT_SET_HEADER_ENABLED_REQUEST");
        this.handleResponse();
      }
    }
    else if (this.elm327Status === ELM_327_SET_FORMATTING_DISABLED_REQ) {
      if (this.elmDataQueue.size() > 1) {
        console.log("ELM_327_SET_FORMATTING_DISABLED_REQ");
        this.handleResponse();
      }
    }
    else if (this.elm327Status === ELM_327_SET_LINE_FEED_REQ) {
      if (this.elmDataQueue.size() > 1) {
        console.log("ELM_327_SET_LINE_FEED_REQ");
        this.handleResponse();
      }
    }
    else if (this.elm327Status === ELM_327_SET_TIMEOUT_REQ) {
      if (this.elmDataQueue.size() > 1) {
        console.log("ELM_327_SET_TIMEOUT_REQ");
        this.handleResponse();
      }
    }
    else if (this.elm327Status === ELM_327_SET_SPACES_DISABLED_REQ) {
      if (this.elmDataQueue.size() > 1) {
        console.log("ELM_327_SET_SPACES_DISABLED_REQ");
        this.handleResponse();
      }
    }
    else if (this.elm327Status === ELM_327_SET_FORMATTING_DISABLED_REQ) {
      if (this.elmDataQueue.size() > 1) {
        console.log("ELM_327_SET_FORMATTING_DISABLED_REQ");
        this.handleResponse();
      }
    }
    else if (this.elm327Status === ELM_327_RESET_REQ) {
      if (this.elmDataQueue.size() > 1) {
        console.log("ELM_327_RESET_REQ");
        this.handleResetResponse();
      }
    }
    else if (this.elm327Status === ELM_327_PID_READ_CLT_REQ) {
      if (this.elmDataQueue.size() > 1) {
        this.updatePIDCLT(value);
        this.processQueue.enqueue(ELM_327_PID_READ_CLT);
        this.setWaiting();


      }
    }
    else if (this.elm327Status === ELM_327_PID_READ_RPM_REQ) {
      if (this.elmDataQueue.size() > 1) {
        this.updatePIDRPM(value);
        this.processQueue.enqueue(ELM_327_PID_READ_RPM);
        this.setWaiting();

      }
    }
    else if (this.elm327Status === ELM_327_PID_READ_MAP_REQ) {
      if (this.elmDataQueue.size() > 1) {
        this.updatePIDMAP(value);
        this.processQueue.enqueue(ELM_327_PID_READ_MAP);
        this.setWaiting();
      }
    }
    else if (this.elm327Status === ELM_327_PID_READ_O2_REQ) {
      if (this.elmDataQueue.size() > 1) {
        this.updatePIDO2(value);
        this.processQueue.enqueue(ELM_327_PID_READ_O2);
        this.setWaiting();
      }
    }
    else if (this.elm327Status === ELM_327_STATUS_AT_MA_REQUEST) {
      if (value.includes("FFER")) 
      {
        console.log("failed");
        console.log(value);

        this.processQueue.enqueue(ELM_327_QUEUE_AT_MA);
        this.setWaiting();

      }
       this.handleCanMessageString(value);
    }
  }

  updatePIDCLT(byteString) {
    var byteArray = byteString.split(" ");
    if (byteArray.length > 0 && byteArray[0] === "41") {

      var byteValue = parseInt("0x"+byteArray[2]);
      var value = byteValue - 40;
      this.setState({values: {...this.state.values, ["clt"]: value}});
    }
  }

  updatePIDRPM(byteString) {

    var byteArray = byteString.split(" ");
    if (byteArray.length > 0 && byteArray[0] === "41") {

      var msb = parseInt("0x"+byteArray[2]);
      var lsb = parseInt("0x"+byteArray[3]);

      msb = msb * 256;
      var value = msb + lsb;
      value = value / 4;
      this.setState({values: {...this.state.values, ["rpm"]: value}});
    }
  }

  updatePIDMAP(byteString) {
    var byteArray = byteString.split(" ");
    if (byteArray.length > 0 && byteArray[0] === "41") {

      var value = parseInt("0x"+byteArray[2]);
      this.setState({values: {...this.state.values, ["map"]: value}});
    }
  }

  updatePIDO2(byteString) {

    var byteArray = byteString.split(" ");
    if (byteArray.length > 0 && byteArray[0] === "41") {

      var msb = parseInt("0x"+byteArray[2]);
      var lsb = parseInt("0x"+byteArray[3]);

      msb = msb / 200;
      lsb = ( (100/128) * lsb) - 100;
      var value = msb + "." + lsb;
      this.setState({values: {...this.state.values, ["lambda"]: value}});
    }
  }

  valueFromBytesUINT8(byteString) {
    value = 0;
    var byteArray = byteString.split(" ");
    if (byteArray.length > 0 && byteArray[0] === "41") {

      var value = parseInt("0x"+byteArray[1]);

    }

    return value;
  }

  valueFromBytesUINT16(byteString) {
    value = 0;
    var byteArray = byteString.split(" ");
    if (byteArray.length > 0 && byteArray[0] === "41") {

      var msb = parseInt("0x"+byteArray[1]);
      var lsb = parseInt("0x"+byteArray[2]);

      msb = msb * 16;

      var value = msb + lsb;
    }

    return value;
  }

  handleCanMessageString(canMessageString) {
    const canMessages = canMessageString.split("\r");
    if(canMessages.length > 0) {
      for (var i = 0; i < canMessages.length; i++) {
        const msg = canMessages[i];
        if (msg.length == 20) {
          this.handleCanMessage(msg);
          break;
        }
      }
    }
  }

  handleCanMessage(canMessage) {  
    const id = canMessage.slice(1, 4);
    if (id === "500") {
      const msg = canMessage.slice(4, (canMessage.length));
      this.updateCLT(msg);
      //this.updateMAP(msg);
      //this.updateRPM(msg);
    }
  }

  updateRPM(canMessage) {
      const rpmByteStr = canMessage.slice(0, 4);
      const msbString = "0x"+rpmByteStr.slice(0,2);
      const lsbString = "0x"+rpmByteStr.slice(2,4);
      //c201
      //49665

      bitValue = 0;

      var sign = msbString & (1 << 7);
      var x = (((msbString & 0xFF) << 8) | (lsbString & 0xFF));
      if (sign) {
         bitValue = 0xFFFF0000 | x;  // fill in most significant bits with 1's
      }
      else 
      {
        bitValue = x;
      }

      var rpmValue = (16000/65535) *bitValue;

      this.setState({values: {...this.state.values, ["rpm"]: rpmValue}});
  }

  updateMAP(canMessage) {
      const cltByteStr = canMessage.slice(4, 8);
      const msbString = "0x"+cltByteStr.slice(0,2);
      const lsbString = "0x"+cltByteStr.slice(2,4);

      bitValue = 0;
      var sign = msbString & (1 << 7);
      var x = (((msbString & 0xFF) << 8) | (lsbString & 0xFF));
      if (sign) {
         bitValue = 0xFFFF0000 | x;  // fill in most significant bits with 1's
      }
      else 
      {
        bitValue = x;
      }

      var cltValue = (600/65535) *bitValue;
      cltValue = parseFloat(cltValue.toFixed(2));

      this.setState({values: {...this.state.values, ["clt"]: cltValue}});
  }

  updateCLT(canMessage) {
      const cltByteStr = canMessage.slice(8, 12);
      const msbString = "0x"+cltByteStr.slice(0,2);
      const lsbString = "0x"+cltByteStr.slice(2,4);

      bitValue = 0;
      var sign = msbString & (1 << 7);
      var x = (((msbString & 0xFF) << 8) | (lsbString & 0xFF));
      if (sign) {
         bitValue = 0xFFFF0000 | x;  // fill in most significant bits with 1's
      }
      else 
      {
        bitValue = x;
      }

      var cltValue = (290/65535) *bitValue;
      cltValue = parseFloat(cltValue.toFixed(2));

      this.setState({values: {...this.state.values, ["clt"]: cltValue}});
  }

  handleResponse() {
    console.log("handleResponse()");
    const isHandled = this.checkIfHandled();
    if (isHandled) {
      this.setWaiting();
    }
  }

  handleResetResponse() {
    console.log("handleResetResponse()");
    const isHandled = this.checkIfResetWasHandled();
    if (isHandled) {
      this.setWaiting();
    }
  }

  checkIfResetWasHandled() {
    const response = this.elmDataQueue.peek();
    if (response.length >0) {
      var lastString = response[response.length - 1];
      if (lastString.includes("LM327")) {
          console.log("OK!");
          return true;
      }
    }
    return false;
  }

  checkIfHandled() {
    const response = this.elmDataQueue.peek();
    if (response.length >0) {
      var lastString = response[response.length - 1];
      if (lastString.includes("OK")) {
          console.log("OK!");
          return true;
      }
    }
    return false;
  }

  setWaiting() {
    this.elm327Status = ELM_327_STATUS_WAITING;
    const that = this; 
    setTimeout(() => {
       that.workTheProcessQueue()
    },50);
  }


  handleELM327ReadVoltageResponse() {
    console.log("handleELM327ReadVoltageResponse()");

    const response = this.elmDataQueue.peek();
    if (response.length > 1) {
      voltageString = "";
      for (var i = 0; i < response.length; i++) {
        voltageString += response[i];
      }
      const voltageStringArray = voltageString.split(">");
      if (voltageStringArray.length > 1) {
        const valueString = voltageStringArray[voltageStringArray.length  - 1];
        this.setState({values: {...this.state.values, ["voltage"]: valueString}});
        this.elm327Status = ELM_327_STATUS_WAITING;
        
        //this.processQueue.enqueue(ELM_327_READ_BATTERY_VOLTAGE);

        const that = this; 
        setTimeout(() => {
           that.workTheProcessQueue()
        },300);
      }
    } 
  }

  handleELM327ObdResponse(value) {
      console.log("handleELM327ObdResponse() value:", value);
      var pidId = value.slice(2, 4);

      if(pidId == pidECT) this.updateECT(value);
      else if(pidId == pidMAP) this.updateMAP(value);
      else if(pidId == pidRPM) this.updateRPM(value);
      else if(pidId == pidO2) this.update02(value);
  }

  isUnableToConnect() {
    var queueString = "";
    for (var i = this.elmDataQueue.size() - 1; i >= 0; i--) {
      queueString += this.elmDataQueue.dequeue();
    }

    const unableToConnnect = queueString.includes(ELM_327_UNABLE_TO_CONNECT);
    return unableToConnnect;
  }

  updateECT(value) {
    console.log("updateECT()");
    var ectByteStr = value.slice(4, 6);
    var msb = parseInt("0x"+ectByteStr.charAt(0));
    msb = msb * 16;
    var lsb = parseInt("0x"+ectByteStr.charAt(1));

    ectValue = msb + lsb;
    console.log("ectValue: ",ectValue);
    this.setState({values: {...this.state.values, ["ect"]: ectValue}});
  }

  update02(value) {
    console.log("update02()");
  }

  async setupNotifications(device) {

      device.monitorCharacteristicForService(
        elm327ServiceUUID,
        elm327NotifyCharacteristicUUID,
        (error, characteristic) => {
        if (error) {
          console.log("error",error.message);
          this.error(error.message)
          return
        }
        this.updateValue(characteristic.uuid, characteristic.value)
      })
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

      if (error) {
        this.error(error.message)
        return
      }

      if (device != null)  {
        if (device.name != null) 
        {

          var infoString = "a";
          var tmpDevice = null;

          switch(device.name) {
            case 'IOS-Vlink':
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

            if (true) 
            {
              this.setState({device: device})

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
                this.workTheProcessQueue();
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
            this.readBatteryVoltage();
          }}
        title={'Read Voltage'}
        />

        <Button 
        style={{marginTop: 10}}
        onPress={() => {
            this.writeAtCommand(AT_MA, ELM_327_STATUS_AT_MA_REQUEST);
          }}
        title={"Read PID's"}
        />
        <View style={{marginTop:20}}/>
        <Text style={styles.pidValueStyle}>{this.device != null ? this.device.name : "no device"}</Text>
        <View style={{marginTop:20}}/>
        <Text style={styles.pidValueStyle}>Voltage: {this.state.values["voltage"]}</Text>
        <Text style={styles.pidValueStyle}>Map: {this.state.values["map"]}</Text>
        <Text style={styles.pidValueStyle}>RPM: {this.state.values['rpm']}</Text>
        <Text style={styles.pidValueStyle}>Lambda: {this.state.values['lambda']}</Text>
        <Text style={styles.pidValueStyle}>CLT: {this.state.values['clt']}</Text>
        <View style={{marginTop:20}}/>
        <ListData style={{marginTop: 50}} dataToList = {this.logMessageList.getItems()} />
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
  pidValueStyle: {
    color: 'white',
    width: 250,
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 20,
    marginTop:5,
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