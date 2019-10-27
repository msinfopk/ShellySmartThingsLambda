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
        shellyDeviceList.forEach(function (shellyDevice) {
            if (!smartThingsDevices.find(function (shellyDevice) { return device.app.externalId == shellyDevice.id; })) {

                // Device from Shelly not found in SmartThings, add it
                let map = {
                    label: shellyDevice.name,
                    profileId: deviceProfileId(shellyDeviceInfo),
                    locationId: locationId,
                    installedAppId: installedAppId,
                    externalId: shellyDevice.id
                };

                let isCombinedRelay = shellyDevice.id.indexOf("_") >= 0
                if (isCombinedRelay) {
                    let relayChannel = externalId.split()[1];
                } else {
                    let relayChannel = 0;
                }

                // Need to get the current status to get the events
                shelly.getSingleShellyDeviceStatus(shellyAccessToken, shellyDevice.id, function (shellyDeviceStatus) {
                    st.createDevice(token, map).then(function (data) {
                        log.debug("created device " + data.deviceId);
                        log.info(JSON.stringify(shelly.initialDeviceEvents(shellyDeviceStatus, relayChannel)));
                        st.sendEvents(token, data.deviceId, shelly.initialDeviceEvents(shellyDeviceStatus, relayChannel))
                    }).catch(function (err) {
                        log.error(`${err}  creating device`);
                    });
                });
            }
        });

        // Iterate over all shelly devices in SmartThings and delete any that are missing from Shelly
        smartThingsDevices.forEach(function (device) {
            if (!shellyDeviceList.find(function (shellyDevice) { return device.app.externalId == shellyDevice.id; })) {

                // Device in SmartThings but not Shelly, delete it
                st.deleteDevice(token, device.deviceId).then(function (data) {
                    log.debug(`deleted device ${device.deviceId}`);
                }).catch(function (err) {
                    log.error(`${err}  deleting device`);
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

function deviceProfileId(shellyDeviceInfo) {
    log.debug(`deviceProfileId(${JSON.stringify(shellyDeviceInfo)})`);
    let result = deviceProfiles.Shelly1OS;
    if (shellyDeviceInfo.data.devices.type == "SHSW-25") {
        result = deviceProfiles.Shelly25;
    }
    // else if (shellyDeviceInfo.data.devices.type == "SHSW-1") {
    //     result = deviceProfiles.Shelly1OS;
    // }
    log.debug(`profileId=${result}`);
    return result;
}