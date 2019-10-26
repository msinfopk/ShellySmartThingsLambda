"use strict";

const qs = require('querystring');
const rp = require('request-promise');
const log = require('../local/log');
const config = require('config');
const shellyApiEndpoint = config.get('shelly.apiEndpoint');
const shellyClientSecret = config.get('shelly.clientSecret');
const shellyApiEndpoint = config.get('shelly.apiEndpoint');
const shellyOauthEndpoint = config.get('shelly.oauthEndpoint');

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
     * @param callback Function called with list of lights
     */
    getShellys: function(token, callback) {
        let options = {
            method: 'GET',
            uri: `${shellyApiEndpoint}/lights`,
            headers: {
                "User-Agent": "SmartThings Integration",
                "Authorization": `Bearer ${token}`
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
     * Returns a description of a particular light
     *
     * @param token
     * @param externalId
     * @param callback
     */
    getLight: function(token, externalId, callback) {
        let options = {
            method: 'GET',
            uri: `${shellyApiEndpoint}/lights/id:${externalId}`,
            headers: {
                "User-Agent": "SmartThings Integration",
                "Authorization": `Bearer ${token}`
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
     * Set the state of a specific light
     *
     * @param token
     * @param externalId
     * @param body
     * @param callback
     */
    sendCommand: function(token, externalId, body, callback) {
        let options = {
            method: 'PUT',
            uri: `${shellyApiEndpoint}/lights/id:${externalId}/state`,
            headers: {
                "User-Agent": "SmartThings Integration",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(body),
            transform: function(body) {
                return JSON.parse(body)
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
     * Given a light state object, returns a list of the events to initialize the state on the SmartThings platform.
     * @param light Object returned from getLight or and item from getShellys
     * @returns List of event objects
     */
    allLightEvents(light) {
        return fullEventList(light);
    },

    initialLightEvents(light) {
        let events = fullEventList(light);
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

function fullEventList(light) {
    const healthStatus = light.connected ? "online" : "offline";
    return [
        {
            component: "main",
            capability: "switch",
            attribute: "switch",
            value: light.power
        }/*,
        {
            component: "main",
            capability: "switchLevel",
            attribute: "level",
            value: light.brightness * 100
        },
        {
            component: "main",
            capability: "colorTemperature",
            attribute: "colorTemperature",
            value: light.color.kelvin
        },
        {
            component: "main",
            capability: "colorControl",
            attribute: "hue",
            value: light.color.hue / 3.6
        },
        {
            component: "main",
            capability: "colorControl",
            attribute: "saturation",
            value: light.color.saturation * 100
        },
        {
            component: "main",
            capability: "color",
            attribute: "colorValue",
            value: {hue: light.color.hue, saturation: light.color.saturation * 100}
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
