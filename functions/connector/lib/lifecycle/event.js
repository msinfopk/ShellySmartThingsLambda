'use strict';

const log = require('../local/log');
const db = require('../local/db');
const shelly = require('../api/shelly');
const st = require('../api/st');
const util = require('../api/util');

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
        db.get(eventData.installedApp.installedAppId, function(state) {
            let shellyAccessToken = util.shellyAccessToken(state, eventData.installedApp.config);
            deviceCommandsEvent.commands.forEach(function(cmd) {
                switch (cmd.command) {
                    case "on": {
                        shelly.sendCommand(shellyAccessToken, deviceCommandsEvent.externalId, {turn: "on"}, function (data, resp) {
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
                        shelly.sendCommand(shellyAccessToken, deviceCommandsEvent.externalId, {power: "off"}, function (data, resp) {
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
                    //     shelly.sendCommand(shellyAccessToken, deviceCommandsEvent.externalId, {
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
                    //     shelly.sendCommand(shellyAccessToken, deviceCommandsEvent.externalId, {
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
                    //     shelly.sendCommand(shellyAccessToken, deviceCommandsEvent.externalId, {
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
                    //     shelly.sendCommand(shellyAccessToken, deviceCommandsEvent.externalId, {
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
                    //     shelly.sendCommand(shellyAccessToken, deviceCommandsEvent.externalId, {
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
            db.get(eventData.installedApp.installedAppId, function(state) {
                let shellyAccessToken = util.shellyAccessToken(state, eventData.installedApp.config);
                shelly.getShellys(shellyAccessToken, function(lights) {
                    lights.forEach(function(light) {
                        let device = devices.find(function(d) { return d.app.externalId == light.id; });
                        if (device) {
                            log.debug(`Sending events for ${light.id}`);
                            st.sendEvents(eventData.authToken, device.deviceId, shelly.allLightEvents(light))
                        }
                    });
                    util.reconcileDeviceLists(token, eventData.installedApp.locationId, eventData.installedApp.installedAppId, lights, devices);
                });
            });
        });
    }
};
