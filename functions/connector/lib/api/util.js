"use strict";

const log = require('../local/log');
const st = require('./st');
const shelly = require('./shelly');

const config = require('config');
const deviceProfiles = config.get('deviceProfiles');
const shellyAccessToken = config.get('shelly.personalAccessToken');


/**
 * Utility methods
 */
module.exports = {

    /**
     * Compares device lists from Shelly and SmartThings, creating and deleting devices as necessary
     *
     * @param token SmartThings access token
     * @param locationId SmartThings location ID
     * @param shellyDevices List of devices from Shelly
     * @param smartThingsDevices List of devices from SmartThings
     */
    reconcileDeviceLists: function (token, locationId, installedAppId, shellyDeviceList, smartThingsDevices) {
        // Iterate over the Shelly devices to see if any are missing from SmartThings and need to be added
        log.info(`Reconciling with Shelly List: ${JSON.stringify(shellyDeviceList, null, 2)}`);
        for (var id in shellyDeviceList) {
            log.trace(`Current Device: ${JSON.stringify(shellyDeviceList[id], null, 2)}`);
            if (!smartThingsDevices.find(function (device) { return device.app.externalId == id; })) {

                // Device from Shelly not found in SmartThings, add it
                let map = {
                    label: shellyDeviceList[id].name,
                    profileId: stDeviceProfileIdfromShellyType(shellyDeviceList[id]),
                    locationId: locationId,
                    installedAppId: installedAppId,
                    externalId: id
                };

                let relayChannel = 0;
                let combinedId = id
                if (id.indexOf('_') >= 0) {
                    combinedId = id.split('_')[0];
                    relayChannel = id.split('_')[1];
                }

                // Need to get the current status to get the events
                shelly.getSingleShellyDeviceStatus(shellyAccessToken, combinedId, function (shellyDeviceStatus) {
                    st.createDevice(token, map).then(function (data) {
                        log.debug("created device " + data.deviceId);
                        log.info(JSON.stringify(shelly.initialDeviceEvents(shellyDeviceStatus, relayChannel)));
                        st.sendEvents(token, data.deviceId, shelly.initialDeviceEvents(shellyDeviceStatus, relayChannel))
                    }).catch(function (err) {
                        log.error(`On creating device:\n${err}`);
                    });
                });
            }
        }

        // Iterate over all shelly devices in SmartThings and delete any that are missing from Shelly
        smartThingsDevices.forEach(function (device) {
            if (!shellyDeviceList.hasOwnProperty(device.app.externalId)) {

                // Device in SmartThings but not Shelly, delete it
                st.deleteDevice(token, device.deviceId).then(function (data) {
                    log.debug(`deleted device ${device.deviceId}`);
                }).catch(function (err) {
                    log.error(`On deleting device:\n${err}`);
                });
            }
        });
    },

    // /**
    //  * Returns Shelly access token, which is in Redis persisted state when using OAuth with clientId and clientSecret
    //  * or in a configuration setting when users enter personal tokens directly
    //  *
    //  * @param state
    //  * @param config
    //  */
    // shellyAccessToken: function(state, config) {
    //     if (state && state.shellyAccessToken) {
    //         //log.debug(`shellyAccessToken, state=${JSON.stringify(state)}`);
    //         return state.shellyAccessToken;
    //     }
    //     else {
    //         //log.debug(`shellyAccessToken, config=${JSON.stringify(config)}`);
    //         return config.shellyAccessToken[0].stringConfig.value;
    //     }
    // }
};

function stDeviceProfileIdfromShellyType(shellyDeviceInfo) {
    log.debug(`stDeviceProfileIdfromShellyType(${JSON.stringify(shellyDeviceInfo)})`);
    let result = deviceProfiles.Shelly1OS;
    if (shellyDeviceInfo.type == "SHSW-25") {
        result = deviceProfiles.Shelly25;
    }
    // else if (shellyDeviceInfo.type == "SHSW-1") {
    //     result = deviceProfiles.Shelly1OS;
    // }
    log.debug(`profileId=${result}`);
    return result;
}

function shellyTypefromSTDeviceProfileId(deviceProfileID) {
    log.debug(`stDeviceProfileIdfromShellyType(${JSON.stringify(shellyDeviceInfo)})`);
    let result = "SHSW-1";  // "359c811e-dc3a-4e76-a987-837071b40b9f" = Shelly1OS
    if (deviceProfileID == deviceProfiles.Shelly25) {
        result = "SHSW-25";
    }
    // else if (shellyDeviceInfo.type == "SHSW-1") {
    //     result = deviceProfiles.Shelly1OS;
    // }
    log.debug(`Shelly Type=${result}`);
    return result;
}