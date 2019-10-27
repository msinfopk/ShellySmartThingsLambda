"use strict";

const qs = require('querystring');
const rp = require('request-promise');
const log = require('../local/log');

const config = require('config');
// const shellyClientId = config.get('shelly.clientId');
// const shellyClientSecret = config.get('shelly.clientSecret');
const shellyApiEndpoint = config.get('shelly.apiEndpoint');
// const shellyOauthEndpoint = config.get('shelly.oauthEndpoint');
// const shellyAccessToken = config.get('shelly.personalAccessToken');

/**
 * Shelly API calls used by this application
 */
module.exports = {

    // /**
    //  * Handles OAuth2 callback from Shelly, making request to exchange the code for access and refresh tokens
    //  *
    //  * @param installedAppId
    //  * @param queryString
    //  * @returns {*}
    //  */
    // handleOauthCallback: function (installedAppId, queryString) {
    //     let params = qs.parse(queryString);
    //     let req = {
    //         client_id: shellyClientId,
    //         client_secret: shellyClientSecret,
    //         grant_type: "authorization_code",
    //         code: params.code,
    //         scope: params.scope
    //     };
    //     let body = JSON.stringify(req);
    //     let options = {
    //         method: 'POST',
    //         uri: `${shellyOauthEndpoint}/token`,
    //         headers: {
    //             "Content-Type": "application/json",
    //             "User-Agent": "SmartThings Integration"
    //         },
    //         body: body,
    //         transform: function (body) {
    //             log.debug("body=" + body);
    //             return JSON.parse(body)
    //         }
    //     };
    //     return rp(options);
    // },

    /**
     * Returns a list of shelly devices
     *
     * @param token Shelly access token
     * @param callback Function called with list of Shelly devices
     */
    listAllShellyDevices: function (token, callback) {
        let options = {
            method: 'POST',
            uri: `${shellyApiEndpoint}/interface/device/list/`,
            headers: {
                // "Content-Type": "application/x-www-form-urlencoded",  // set automatically
                "User-Agent": "SmartThings Integration"
            },
            form: {
                auth_key: `${token}`
            },
            transform: function (body) {
                let fullBody = JSON.parse(body);
                log.info(body);
                log.info(fullBody.device);
                return fullBody.devices;
            }
        };
        rp(options)
            .then(function (data) {
                callback(data);
            })
            .delay(1000);  // make sure we do not exceed the 1 request / second limit
    },

    /**
     * Returns the status of all Shelly devices
     *
     * @param token Shelly access token
     * @param callback Function called with list of Shelly devices
     */
    getAllShellyDeviceStatuses: function (token, callback) {
        let options = {
            method: 'POST',
            uri: `${shellyApiEndpoint}/device/all_status`,
            headers: {
                // "Content-Type": "application/x-www-form-urlencoded",  // set automatically
                "User-Agent": "SmartThings Integration"
            },
            form: {
                auth_key: `${token}`
            },
            transform: function (body) {
                let fullBody = JSON.parse(body);
                log.info(body);
                log.info(fullBody.data.devices_status);
                return fullBody.data.devices_status;
            }
        };
        rp(options)
            .then(function (data) {
                callback(data);
            })
            .delay(1000);  // make sure we do not exceed the 1 request / second limit
    },

    /**
     * Returns a description of a particular device
     *
     * @param token
     * @param externalId
     * @param callback
     */
    getSingleShellyDeviceStatus: function (token, externalId, callback) {
        let options = {
            method: 'POST',
            uri: `${shellyApiEndpoint}/device/status/`,
            headers: {
                // "Content-Type": "application/x-www-form-urlencoded",  // set automatically
                "User-Agent": "SmartThings Integration"
            },
            form: {
                auth_key: `${token}`,
                id: `${externalId}`
            },
            transform: function (body) {
                let fullBody = JSON.parse(body);
                log.info(body);
                log.info(fullBody.data.devices_status);
                return fullBody.data.devices_status;
            }
        };
        rp(options)
            .then(function (data) {
                callback(data);
            });
    },

    /**
     * Set the state of a specific relay
     *
     * @param token
     * @param externalId
     * @param channel
     * @param action
     * @param callback
     */
    sendRelayCommand: function (token, externalId, relayAction, callback) {
        let isCombinedRelay = externalId.indexOf("_") >= 0
        if (isCombinedRelay) {
            let shellyID = externalId.split()[0];
            let relayChannel = externalId.split()[1];
        } else {
            let shellyID = externalId;
            let relayChannel = 0;
        }
        let options = {
            method: 'POST',
            uri: `${shellyApiEndpoint}/device/relay/control`,
            headers: {
                // "Content-Type": "application/x-www-form-urlencoded",  // set automatically
                "User-Agent": "SmartThings Integration"
            },
            form: {
                auth_key: `${token}`,
                id: `${externalId}`,
                channel: `${relayChannel}`,
                turn: `${relayAction}`
            }
        };
        log.debug(`authorization=${options.headers.Authorization}`);
        log.debug(`uri=${options.uri}`);
        rp(options)
            .then(function (data) {
                if (data && callback) {
                    callback(data);
                }
            })
            .catch(function (err) {
                log.error(`${err} sending commands to ${externalId}`)
            });
    },

    /**
     * Given a device state object, returns a list of the events to initialize the state on the SmartThings platform.
     * @param device Object returned from getSingleShellyDeviceStatus or and item from getAllShellyDeviceStatuses
     * @returns List of event objects
     */
    allDeviceEvents(shellyDeviceStatus, shellyChannel) {
        return fullEventList(shellyDeviceStatus, shellyChannel);
    },

    initialDeviceEvents(shellyDeviceStatus, shellyChannel) {
        let events = fullEventList(shellyDeviceStatus, shellyChannel);
        /*
        events.push({
            component: "main",
            capability: "healthCheck",
            attribute: "DeviceWatch-Enroll",
            value: '{"protocol": "cloud", "scheme":"untracked"}'
        });
        */
        return events;
    }
};

function fullEventList(shellyDeviceStatus, shellyChannel) {
    const healthStatus = shellyDeviceStatus.cloud.connected ? "online" : "offline";
    const relayStatus = shellyDeviceStatus.relays[shellyChannel].ison ? "on" : "off";
    return [
        {
            component: "main",
            capability: "switch",
            attribute: "switch",
            value: relayStatus
        }/*,
        {
            component: "main",
            capability: "switchLevel",
            attribute: "level",
            value: shellyDevice.brightness * 100
        },
        {
            component: "main",
            capability: "colorTemperature",
            attribute: "colorTemperature",
            value: shellyDevice.color.kelvin
        },
        {
            component: "main",
            capability: "colorControl",
            attribute: "hue",
            value: shellyDevice.color.hue / 3.6
        },
        {
            component: "main",
            capability: "colorControl",
            attribute: "saturation",
            value: shellyDevice.color.saturation * 100
        },
        {
            component: "main",
            capability: "color",
            attribute: "colorValue",
            value: {hue: shellyDevice.color.hue, saturation: shellyDevice.color.saturation * 100}
        },
        {
            component: "main",
            capability: "bypassable",
            attribute: "bypassStatus",
            value: "bypassed"
        }*/
        ,
        {
            component: "main",
            capability: "temperatureMeasurement",
            attribute: "powerMeter",
            value: shellyDeviceStatus.tmp.tC
        },
        {
            component: "main",
            capability: "temperatureMeasurement",
            attribute: "unit",
            value: "C"
        },
        {
            component: "main",
            capability: "powerMeter",
            attribute: "value",
            value: shellyDeviceStatus.meters[shellyChannel].power
        },
        {
            component: "main",
            capability: "healthCheck",
            attribute: "DeviceWatch-DeviceStatus",
            value: healthStatus
        },
        {
            component: "main",
            capability: "healthCheck",
            attribute: "healthStatus",
            value: healthStatus
        }
    ];
}
