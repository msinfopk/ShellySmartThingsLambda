'use strict';

const log = require('../local/log');
const shelly = require('../api/shelly');
const st = require('../api/st');
const util = require('../api/util');
var Bottleneck = require("bottleneck");

const config = require('config');
const shellyAccessToken = config.get('shelly.personalAccessToken');

// Restrict us to one request per second
var shellyAPIlimiter = new Bottleneck(1, 1000);

module.exports = {

    /**
     * Handles device command events, calling Shelly to control the bulb and generating the appropriate events
     *
     * @param eventData
     * @param commandsEvent
     */
    handleDeviceCommand: function (eventData, commandsEvent) {
        let deviceCommandsEvent = commandsEvent.deviceCommandsEvent;
        let token = eventData.authToken;
        // let shellyAccessToken = util.shellyAccessToken(state, eventData.installedApp.config);
        shellyAPIlimiter.schedule(() => {
            // deviceCommandsEvent.commands.forEach(function (cmd) {
            const allCommands = deviceCommandsEvent.map(function (cmd) {
                switch (cmd.command) {
                    case "on": {
                        shelly.sendRelayCommand(shellyAccessToken, deviceCommandsEvent.externalId, "on", function (data, resp) {
                            let body = [
                                {
                                    component: "main",
                                    capability: "switch",
                                    attribute: "switch",
                                    value: "on"
                                }
                            ];
                            st.sendEvents(token, deviceCommandsEvent.deviceId, body);
                        });
                        break;
                    }
                    case "off": {
                        shelly.sendRelayCommand(shellyAccessToken, deviceCommandsEvent.externalId, "off", function (data, resp) {
                            let body = [
                                {
                                    component: "main",
                                    capability: "switch",
                                    attribute: "switch",
                                    value: "off"
                                }
                            ];
                            st.sendEvents(token, deviceCommandsEvent.deviceId, body);
                        });
                        break;
                    }
                    // // Would be needed for LED controller and Dimmer (when it comes out)
                    // case "setLevel": {
                    //     let level = cmd.arguments[0];
                    //     let shellyLevel = level / 100.0;
                    //     shelly.sendLightCommand(shellyAccessToken, deviceCommandsEvent.externalId, {
                    //         power: "on",
                    //         brightness: shellyLevel
                    //     }, function (data, resp) {
                    //         let body = [
                    //             {
                    //                 component: "main",
                    //                 capability: "switch",
                    //                 attribute: "switch",
                    //                 value: "on"
                    //             },
                    //             {
                    //                 component: "main",
                    //                 capability: "switchLevel",
                    //                 attribute: "level",
                    //                 value: level
                    //             }
                    //         ];
                    //         st.sendEvents(token, deviceCommandsEvent.deviceId, body);
                    //     });
                    //     break;
                    // }
                    // // Would be needed for LED controller
                    // case "setHue": {
                    //     let hue = cmd.arguments[0];
                    //     let shellyHue = hue * 3.6;
                    //     shelly.sendLightCommand(shellyAccessToken, deviceCommandsEvent.externalId, {
                    //         power: "on",
                    //         color: `hue:${shellyHue}`
                    //     }, function (data, resp) {
                    //         let body = [
                    //             {
                    //                 component: "main",
                    //                 capability: "switch",
                    //                 attribute: "switch",
                    //                 value: "on"
                    //             },
                    //             {
                    //                 component: "main",
                    //                 capability: "colorControl",
                    //                 attribute: "hue",
                    //                 value: hue
                    //             }
                    //         ];
                    //         st.sendEvents(token, deviceCommandsEvent.deviceId, body);
                    //     });
                    //     break;
                    // }
                    // // Would be needed for LED controller
                    // case "setSaturation": {
                    //     let saturation = cmd.arguments[0];
                    //     let shellySat = saturation / 100.0;
                    //     shelly.sendLightCommand(shellyAccessToken, deviceCommandsEvent.externalId, {
                    //         power: "on",
                    //         color: `saturation:${shellySat}`
                    //     }, function (data, resp) {
                    //         let body = [
                    //             {
                    //                 component: "main",
                    //                 capability: "switch",
                    //                 attribute: "switch",
                    //                 value: "on"
                    //             },
                    //             {
                    //                 component: "main",
                    //                 capability: "colorControl",
                    //                 attribute: "saturation",
                    //                 value: saturation
                    //             }
                    //         ];
                    //         st.sendEvents(token, deviceCommandsEvent.deviceId, body);
                    //     });
                    //     break;
                    // }
                    // // Would be needed for LED controller
                    // case "setColorTemperature": {
                    //     let kelvin = cmd.arguments[0];
                    //     shelly.sendLightCommand(shellyAccessToken, deviceCommandsEvent.externalId, {
                    //         power: "on",
                    //         color: `kelvin:${kelvin}`
                    //     }, function (data, resp) {
                    //         let body = [
                    //             {
                    //                 component: "main",
                    //                 capability: "switch",
                    //                 attribute: "switch",
                    //                 value: "on"
                    //             },
                    //             {
                    //                 component: "main",
                    //                 capability: "colorTemperature",
                    //                 attribute: "colorTemperature",
                    //                 value: kelvin
                    //             }
                    //         ];
                    //         st.sendEvents(token, deviceCommandsEvent.deviceId, body);
                    //     });
                    //     break;
                    // }
                    // // Would be needed for LED controller
                    // case "setColor": {
                    //     let map = cmd.arguments[0];
                    //     let shellyHue = map.hue * 3.6;
                    //     let shellySat = map.saturation / 100.0;
                    //     shelly.sendLightCommand(shellyAccessToken, deviceCommandsEvent.externalId, {
                    //         power: "on",
                    //         color: `hue:${shellyHue} saturation:${shellySat}`
                    //     }, function (data, resp) {
                    //         let body = [
                    //             {
                    //                 component: "main",
                    //                 capability: "switch",
                    //                 attribute: "switch",
                    //                 value: "on"
                    //             },
                    //             {
                    //                 component: "main",
                    //                 capability: "colorControl",
                    //                 attribute: "hue",
                    //                 value: map.hue
                    //             },
                    //             {
                    //                 component: "main",
                    //                 capability: "colorControl",
                    //                 attribute: "saturation",
                    //                 value: map.saturation
                    //             }
                    //         ];
                    //         st.sendEvents(token, deviceCommandsEvent.deviceId, body);
                    //     });
                    //     break;
                    // }
                }
            });
            return Promise.all(allCommands);
        });
    },

    /**
     * Handles the periodic polling event
     *
     * @param eventData
     * @param scheduleEvent
     */
    handleScheduledEvent: function (eventData, scheduleEvent) {
        let token = eventData.authToken;
        st.listDevices(token, eventData.installedApp.locationId, eventData.installedApp.installedAppId).then(function (smartThingsDevices) {
            // let shellyAccessToken = util.shellyAccessToken(state, eventData.installedApp.config);
            shelly.getAllShellyDeviceStatuses(shellyAccessToken, function (shellyDeviceStatuses) {
                shellyDeviceStatuses.forEach(function (shellyDeviceStatus) {
                    shellyDevice.relays.forEach(function (thisRelay, thisRelayChannel) {
                        let smartThingsID = shellyDevice.id;
                        if (thisRelayChannel > 0) {
                            let smartThingsID = shellyDevice.id + "_" + thisRelayChannel;
                        }
                        let smartThingsDevice = smartThingsDevices.find(function (d) { return d.app.externalId == smartThingsID; });
                        if (smartThingsDevice) {
                            log.debug(`Sending events for ${shellyDevice.id}`);
                            st.sendEvents(eventData.authToken, device.deviceId, shelly.allDeviceEvents(shellyDeviceStatus, thisRelayChannel))
                        }
                    });
                });
            });
            shelly.listAllShellyDevices(shellyAccessToken, function (shellyDevices) {
                util.reconcileDeviceLists(token, eventData.installedApp.locationId, eventData.installedApp.installedAppId, shellyDevices, smartThingsDevices);
            });
        });
    }
};
