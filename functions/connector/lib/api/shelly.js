"use strict";

const qs = require('querystring');
const rp = require('request-promise');
var rpErrors = require('request-promise/errors');
const log = require('../local/log');
var Bottleneck = require("bottleneck");

const config = require('config');
// const shellyClientId = config.get('shelly.clientId');
// const shellyClientSecret = config.get('shelly.clientSecret');
const shellyApiEndpoint = config.get('shelly.apiEndpoint');
// const shellyOauthEndpoint = config.get('shelly.oauthEndpoint');
// const shellyAccessToken = config.get('shelly.personalAccessToken');


// Restrict all calls the Shelly API to one request per second
// I've found even set at 1000ms, I hit the limit a lot, so I set it bigger
var shellyAPIlimiter = new Bottleneck({
    minTime: 1500,
    maxConcurrent: 1
});

// Retry calls up to one time
shellyAPIlimiter.on("error", async (error, jobInfo) => {
    const id = jobInfo.options.id;
    log.warn(`Job ${id} had an error: ${error}`);

    if (jobInfo.retryCount === 0) { // Here we only retry once
        log.info(`Retrying job ${id} in 1.5s!`);
        return 1500;
    }
});
shellyAPIlimiter.on("failed", async (error, jobInfo) => {
    const id = jobInfo.options.id;
    log.warn(`Job ${id} had an error: ${error}`);

    if (jobInfo.retryCount === 0) { // Here we only retry once
        log.info(`Retrying job ${id} in 1s!`);
        return 1000;
    }
});
shellyAPIlimiter.on("debug", function (message, data) {
    // Useful to figure out what the limiter is doing in real time
    // and to help debug your application
    log.trace(`${message}\n${data}`);
});

// Listen to the "retry" event, just to print a trace when we're retrying
shellyAPIlimiter.on("retry", (error, jobInfo) => log.trace(`Now retrying ${jobInfo.options.id}`));


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
    listAllShellyDevices: shellyAPIlimiter.wrap(_listAllShellyDevices),

    /**
     * Returns the status of all Shelly devices
     *
     * @param token Shelly access token
     * @param callback Function called with list of Shelly devices
     */
    getAllShellyDeviceStatuses: shellyAPIlimiter.wrap(_getAllShellyDeviceStatuses),

    /**
     * Returns the status of a particular device
     *
     * @param token
     * @param externalId
     * @param callback
     */
    getSingleShellyDeviceStatus: shellyAPIlimiter.wrap(_getSingleShellyDeviceStatus),

    /**
     * Set the state of a specific relay
     *
     * @param token
     * @param externalId
     * @param channel
     * @param action
     * @param callback
     */
    sendRelayCommand: shellyAPIlimiter.wrap(_sendRelayCommand),

    /**
     * Given a device state object, returns a list of the events to initialize the state on the SmartThings platform.
     * @param device Object returned from getSingleShellyDeviceStatus or and item from getAllShellyDeviceStatuses
     * @returns List of event objects
     */
    allDeviceEvents(shellyDeviceStatus, shellyChannel) {
        return shellyStatusToSTEvent(shellyDeviceStatus, shellyChannel);
    },

    initialDeviceEvents(shellyDeviceStatus, shellyChannel) {
        let events = shellyStatusToSTEvent(shellyDeviceStatus, shellyChannel);
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

// A check for an OK response from Shelly
// Even with the bottleneck, sometimes the request go through too quickly
// I think this is happening because more than one job is spun up in lambda
function verifyIsOk(apiResponse) {
    log.trace(`Checking Shelly Response is OK: ${JSON.stringify(apiResponse, null, 2)}`);
    if (!apiResponse.isok) {
        log.trace("Response is NOT OK - probably a request limit rejection!");
        throw new Error("Shelly API call rejected!");
    } else {
        log.trace("Response OK!");
        return apiResponse;
    }
}


function _listAllShellyDevices(token, callback) {
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
            verifyIsOk(fullBody);
            // log.info(`Shelly Response: ${JSON.stringify(fullBody, null, 2)}`);
            return fullBody.data.devices;
        }
    };
    log.trace(`Shelly Request URI: ${options.uri}\n${JSON.stringify(options.form, null, 2)}`);
    rp(options)
        .then(function (data) {
            callback(data);
        })
        .catch(rpErrors.TransformError, function (err) {
            log.error(`On getting list of devices:\n${err}`)
        })
        .catch(function (err) {
            log.error(`On getting list of devices:\n${err}`)
        });
}


function _getAllShellyDeviceStatuses(token, callback) {
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
            verifyIsOk(fullBody);
            // log.info(`Shelly Response: ${JSON.stringify(fullBody, null, 2)}`);
            return fullBody.data.devices_status;
        }
    };
    log.trace(`Shelly Request URI: ${options.uri}\n${JSON.stringify(options.form, null, 2)}`);
    rp(options)
        .then(function (data) {
            callback(data);
        })
        .catch(rpErrors.TransformError, function (err) {
            log.error(`On getting all statuses:\n${err}`)
        })
        .catch(function (err) {
            log.error(`On getting all statuses:\n${err}`)
        });
}


function _getSingleShellyDeviceStatus(token, externalId, callback) {
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
            verifyIsOk(fullBody);
            // log.info(`Shelly Response: ${JSON.stringify(fullBody, null, 2)}`);
            return fullBody.data.device_status;
        }
    };
    log.trace(`Shelly Request URI: ${options.uri}\n${JSON.stringify(options.form, null, 2)}`);
    rp(options)
        .then(function (data) {
            callback(data);
        })
        .catch(rpErrors.TransformError, function (err) {
            log.error(`On getting status of ${externalId}:\n${err}`)
        })
        .catch(function (err) {
            log.error(`On getting status of ${externalId}:\n${err}`)
        });
}


function _sendRelayCommand(token, externalId, relayAction, callback) {
    let relayChannel = 0;
    let shellyID = externalId;
    if (externalId.indexOf("_") >= 0) {
        shellyID = externalId.split("_")[0];
        relayChannel = externalId.split("_")[1];
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
            id: `${shellyID}`,
            channel: `${relayChannel}`,
            turn: `${relayAction}`
        },
        transform: function (body) {
            let fullBody = JSON.parse(body);
            verifyIsOk(fullBody);
            // log.info(`Shelly Response: ${JSON.stringify(fullBody, null, 2)}`);
            return fullBody;
        }
    };
    log.trace(`Shelly Request URI: ${options.uri}\n${JSON.stringify(options.form, null, 2)}`);
    rp(options)
        .then(function (data) {
            if (data && callback) {
                callback(data);
            }
        })
        .catch(rpErrors.TransformError, function (err) {
            log.error(`On sending commands to ${externalId}:\n${err}`)
        })
        .catch(function (err) {
            log.error(`On sending commands to ${externalId}:\n${err}`)
        });
}


function shellyStatusToSTEvent(shellyDeviceStatus, shellyChannel) {
    log.trace(`Parsing Events from Relay ${shellyChannel} status: ${JSON.stringify(shellyDeviceStatus, null, 2)}`);
    const healthStatus = shellyDeviceStatus.cloud.connected ? "online" : "offline";
    let eventStates = [
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
    if (shellyDeviceStatus.hasOwnProperty('relays')) {
        const relayStatus = shellyDeviceStatus.relays[shellyChannel].ison ? "on" : "off";
        eventStates.push(
            {
                component: "main",
                capability: "switch",
                attribute: "switch",
                value: relayStatus
            }
        );
    }
    if (shellyDeviceStatus.hasOwnProperty('tmp')) {
        const temperature = shellyDeviceStatus.tmp.tC;
        eventStates.push(
            {
                component: "main",
                capability: "temperatureMeasurement",
                attribute: "temperature",
                value: temperature,
                unit: "C"
            }
        );
    }
    if (shellyDeviceStatus.hasOwnProperty('meters') & shellyDeviceStatus.meters[shellyChannel].hasOwnProperty('timestamp')) {
        const power = shellyDeviceStatus.meters[shellyChannel].power
        eventStates.push(
            {
                component: "main",
                capability: "powerMeter",
                attribute: "power",
                value: power,
                unit: "W"
            }
        );
    }
    log.trace("Generated Events:\n" + JSON.stringify(eventStates));
    return eventStates;
}