'use strict';

const WebSocketClient = require('websocket').client;
const config = require('../config');

const CMD_DEVICE_LIST = 'devicelist';
const CMD_CLIENT_LIST = 'ClientList';
const CMD_SET_DEVICE_INDEX = 'setdeviceindex';
const CMD_SENSOR_UPDATE = 'SensorUpdate';

const SWITCH_BINARY = 'SWITCH BINARY';
const SWITCH_MULTILEVEL = 'SWITCH MULTILEVEL';

function getId() {
    if (!getId.id || getId.id > 999) {
        getId.id = 0;
    }
    return ++getId.id;
}

class Almond {
    constructor(config) {
        this.socket = new WebSocketClient();
        this.events = {};
        this.queue = [];
        this.mii = {};
        this.devices = {};

        this.socket.on('connect', this._handleConnect.bind(this));
        this.socket.on('connectFailed', this._handleError.bind(this));
        this.socket.connect(`ws://${config.host}:${config.port}/${config.password}`);
    }

    _handleConnect(connection) {
        console.log('Connection Established to Almond Plus: ' + connection.remoteAddress);

        this.connection = connection;
        this.connection.on('message', this._handleMessage.bind(this));
        this.connection.on('close', (r,d) => this._handleError(d));
        this.connection.on('error', (d) => this._handleError(d));
        this._flushQueue();
    }

    _handleError(error) {
        const strError = error.toString().trim();
        if (strError.toLowerCase() === 'policy violation') {
            console.error('Error: Invalid Password');
        } else {
            console.error(strError);
        }
    }

    _flushQueue() {
        while(this.queue.length > 0) {
            this.send(this.queue.pop());
        }
    }

    _getDeviceActions(device) {
        const actions = [];

        switch(device.devicetype) {
        case '1':
            actions.push(
                'turnOn',
                'turnOff'
            );
            break;
        case '2':
        case '4':
            actions.push(
                'turnOn',
                'turnOff',
                'setPercentage',
                'incrementPercentage',
                'decrementPercentage'
            );
            break;
        case '7':
            actions.push(
                'setTargetTemperature',
                'incrementTargetTemperature',
                'decrementTargetTemperature'
            );
        }
        return actions;
    }

    _getApplianceDetails(device) {
        const obj = {};

        if (device.devicetype === '2') {
            obj.maxValue = 100;
        } else if (device.devicetype === '4') {
            obj.maxValue = 254;
        }

        Object.keys(device.devicevalues).forEach((v) => {
            const value = device.devicevalues[v];
            if (value.name === SWITCH_BINARY) {
                obj.binaryIndex = value.index;
            } else if (value.name === SWITCH_MULTILEVEL) {
                obj.multiIndex = value.index;
            }
        });

        return obj;
    }

    _onDeviceList(devices) {
        this.devices = Object.keys(devices)
            .map(id => {
                const device = devices[id];
                return {
                    actions: this._getDeviceActions(device),
                    additionalApplianceDetails: this._getApplianceDetails(device),
                    applianceId: id,
                    friendlyDescription: device.friendlydevicetype,
                    friendlyName: device.devicename,
                    isReachable: true,
                    manufacturerName: 'Almond Plus',
                    modelName: device.friendlydevicetype,
                    version: Object.keys(device.devicevalues)
                        .reduce((p, c) => {
                            return (/switch binary/i).test(device.devicevalues[c].name) ? c : p;
                        }, '0'),
                };
            });
        Object.keys(devices).forEach(id => console.log(`Found device: ${devices[id].devicename}`));
    }

    _resolvePromise(mii, data) {
        const p = this.mii[mii];
        if (p) {
            p.resolve(data);
            this.mii[mii] = null;
        }
    }

    _handleMessage(message) {
        if (message.type === 'utf8') {
            const data = JSON.parse(message.utf8Data);
            const mii = data.mii || data.MobileInternalIndex;

            this._sendEvent('message', data);

            switch(data.commandtype || data.CommandType) {
            case CMD_DEVICE_LIST:
                this._onDeviceList(data.data);
                break;
            }
            this._resolvePromise(mii, data);
        }
    }

    _sendEvent(eventName, data) {
        console.log('Data Received -> CommandType: ' + (data.commandtype || data.CommandType));
        if (this.events[eventName]) {
            this.events[eventName].forEach(fn => typeof fn === 'function' && fn(data));
        }
    }

    on(eventName, fn) {
        if (!this.events[eventName]) { this.events[eventName] = []; }

        if (this.events[eventName].indexOf(fn) === -1) {
            this.events[eventName].push(fn);
        }
    }

    off(eventName, fn) {
        if (this.events[eventName]) {
            const i = this.events[eventName].indexOf(fn);
            this.events[eventName].splice(i, 1);
        }
    }

    send(data) {
        // TODO: Normalize data
        const connection = this.connection;
        if (connection) {
            connection.sendUTF(JSON.stringify(data));
        } else {
            this.queue.push(data);
        }
    }

    sendAction(data) {

        const mii = getId();

        this.mii[mii] = Promise.defer();
        this.send({
            mii: mii,
            cmd: CMD_SET_DEVICE_INDEX,
            devid: data.applianceId,
            index: data.index,
            value: data.value
        });
        return this.mii[mii].promise;
    }

    getDevices() {
        return this.devices;
    }
};

const almond = new Almond(config);

// Get initial device information
almond.send({ mii: 1, cmd: CMD_DEVICE_LIST });
almond.send({ MobileInternalIndex: 1, CommandType: CMD_CLIENT_LIST });

module.exports = almond;
