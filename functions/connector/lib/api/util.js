"use strict";

const log = require('../local/log');
const st = require('./st');
const shelly = require('./shelly');
const config = require('config');
const deviceProfiles = config.get('deviceProfiles');

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
    reconcileDeviceLists: function (token, locationId, installedAppId, shellyDevices, smartThingsDevices) {
        // Iterate over the Shelly devices to see if any are missing from SmartThings and need to be added
        shellyDevices.forEach(function (shellyDevice) {
            if (!smartThingsDevices.find(function (shellyDevice) { return device.app.externalId == shellyDevice.id; })) {

                // Device from Shelly not found in SmartThings, add it
                let map = {
                    label: shellyDevice.label,
                    profileId: deviceProfileId(lighshellyDevicet),
                    locationId: locationId,
                    installedAppId: installedAppId,
                    externalId: shellyDevice.id
                };

                st.createDevice(token, map).then(function (data) {
                    log.debug("created device " + data.deviceId);
                    log.info(JSON.stringify(shelly.initialDeviceEvents(shellyDevice)));
                    st.sendEvents(token, data.deviceId, shelly.initialDeviceEvents(shellyDevice))
                }).catch(function (err) {
                    log.error(`${err}  creating device`);
                });
            }
        });

        // Iterate over all shelly devices in SmartThings and delete any that are missing from Shelly
        smartThingsDevices.forEach(function(device) {
            if (!shellyDevices.find(function (shellyDevice) { return device.app.externalId == shellyDevice.id; })) {

                // Device in SmartThings but not Shelly, delete it
                st.deleteDevice(token, device.deviceId).then(function(data) {
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

function deviceProfileId(shellyDevice) {
    log.debug(`deviceProfileId(${JSON.stringify(shellyDevice)})`);
    let result = deviceProfiles.white;
    if (shellyDevice.product.capabilities.has_color) {
        result = deviceProfiles.color;
    }
    else if (shellyDevice.product.capabilities.has_variable_color_temp) {
        result = deviceProfiles.colorTemp;
    }
    log.debug(`profileId=${result}`);
    return result;
}