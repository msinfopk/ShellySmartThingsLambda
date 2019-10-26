"use strict";

const qs = require('querystring');
const rp = require('request-promise');
const log = require('../local/log');
const config = require('config');

// const shellyClientId = config.get('shelly.clientId');
// const shellyClientSecret = config.get('shelly.clientSecret');
// const shellyApiEndpoint = config.get('shelly.apiEndpoint');
// const shellyOauthEndpoint = config.get('shelly.oauthEndpoint');

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
    getAllShellyDevices: function(token, callback) {
        let options = {
            method: 'POST',
            uri: `${shellyApiEndpoint}/device/all_status`,
            headers: {
                "User-Agent": "SmartThings Integration",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            form: {
                auth_key: `${token}`
            },
            transform: function (body) {
                return JSON.parse(body)
            }
        };
        rp(options).then(function(data) {
            callback(data);
        });
    },

    /**
     * Returns a description of a particular device
     *
     * @param token
     * @param externalId
     * @param callback
     */
    getSingleShellyDevice: function(token, externalId, callback) {
        let options = {
            method: 'POST',
            uri: `${shellyApiEndpoint}/device/status/`,
            headers: {
                "User-Agent": "SmartThings Integration",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            form: {
                auth_key: `${token}`,
                id: `${externalId}`
            },
            transform: function (body) {
                return JSON.parse(body)
            }
        };
        rp(options).then(function(data) {
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
    sendRelayCommand: function (token, externalId, relayChannel, relayAction, callback) {
        let options = {
            method: 'POST',
            uri: `${shellyApiEndpoint}/device/relay/control`,
            headers: {
                "User-Agent": "SmartThings Integration",
                "Content-Type": "application/x-www-form-urlencoded"
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
        rp(options).then(function(data) {
            if (data && callback) {
                callback(data);
            }
        }).catch(function(err){
            log.error(`${err} sending commands to ${externalId}`)
        });
    },

    /**
     * Given a device state object, returns a list of the events to initialize the state on the SmartThings platform.
     * @param device Object returned from getSingleShellyDevice or and item from getAllShellyDevices
     * @returns List of event objects
     */
    allDeviceEvents(shellyDevice) {
        return fullEventList(shellyDevice);
    },

    initialDeviceEvents(shellyDevice) {
        let events = fullEventList(shellyDevice);
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

function fullEventList(shellyDevice) {
    return [
        {
            component: "main",
            capability: "switch",
            attribute: "switch",
            value: shellyDevice.data.relays.[channel].ison
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
            capability: "healthCheck",
            attribute: "DeviceWatch-DeviceStatus",
            value: shellyDevice.data.online
        },
        {
            component: "main",
            capability: "healthCheck",
            attribute: "healthStatus",
            value: shellyDevice.isok
        }
    ];
}
