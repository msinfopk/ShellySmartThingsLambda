'use strict';

const log = require('../local/log');
const shelly = require('../api/shelly');
const st = require('../api/st');
const util = require('../api/util');

const shellyAccessToken = config.get('shelly.oauthEndpoint');

module.exports = {

    /**
     * Handles device command events, calling Shelly to control the bulb and generating the appropriate events
     *
     * @param eventData
     * @param commandsEvent
     */
    handleDeviceCommand: function(eventData, commandsEvent) {
        let deviceCommandsEvent = commandsEvent.deviceCommandsEvent;
        let token = eventData.authToken;
        // let shellyAccessToken = util.shellyAccessToken(state, eventData.installedApp.config);
        deviceCommandsEvent.commands.forEach(function(cmd) {
            switch (cmd.command) {
                case "on": {
                    shelly.sendRelayCommand(shellyAccessToken, deviceCommandsEvent.externalId, {turn: "on"}, function (data, resp) {
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
                    shelly.sendRelayCommand(shellyAccessToken, deviceCommandsEvent.externalId, { turn: "off"}, function (data, resp) {
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
    },

    /**
     * Handles the periodic polling event
     *
     * @param eventData
     * @param scheduleEvent
     */
    handleScheduledEvent: function(eventData, scheduleEvent) {
        let token = eventData.authToken;
        st.listDevices(token, eventData.installedApp.locationId, eventData.installedApp.installedAppId).then(function(devices) {
            // let shellyAccessToken = util.shellyAccessToken(state, eventData.installedApp.config);
            shelly.getAllShellyDevices(shellyAccessToken, function(sDevices) {
                shellyDevices.forEach(function (shellyDevice) {
                    let smartThingsDevice = devices.find(function (d) { return d.app.externalId == shellyDevice.id; });
                    if (smartThingsDevice) {
                        log.debug(`Sending events for ${shellyDevice.id}`);
                        st.sendEvents(eventData.authToken, device.deviceId, shelly.allDeviceEvents(shellyDevice))
                    }
                });
                util.reconcileDeviceLists(token, eventData.installedApp.locationId, eventData.installedApp.installedAppId, shellyDevices, devices);
            });
        });
    }
};
