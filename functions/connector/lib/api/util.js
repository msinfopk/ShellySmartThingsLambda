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
        // Iterate over lights to see if any are missing from SmartThings and need to be added
        shellyDevices.forEach(function (light) {
            if (!smartThingsDevices.find(function (device) { return device.app.externalId == light.id; })) {

                // Device from Shelly not found in SmartThings, add it
                let map = {
                    label: light.label,
                    profileId: deviceProfileId(light),
                    locationId: locationId,
                    installedAppId: installedAppId,
                    externalId: light.id
                };

                st.createDevice(token, map).then(function (data) {
                    log.debug("created device " + data.deviceId);
                    log.info(JSON.stringify(shelly.initialLightEvents(light)));
                    st.sendEvents(token, data.deviceId, shelly.initialLightEvents(light))
                }).catch(function (err) {
                    log.error(`${err}  creating device`);
                });
            }
        });

        // Iterate over all lights in SmartThings and delete any that are missing from Shelly
        smartThingsDevices.forEach(function(device) {
            if (!shellyDevices.find(function(light) { return device.app.externalId == light.id; })) {

                // Device in SmartThings but not Shelly, delete it
                st.deleteDevice(token, device.deviceId).then(function(data) {
                    log.debug(`deleted device ${device.deviceId}`);
                }).catch(function (err) {
                    log.error(`${err}  deleting device`);
                });
            }
        });
    },

    /**
     * Returns Shelly access token, which is in Redis persisted state when using OAuth with clientId and clientSecret
     * or in a configuration setting when users enter personal tokens directly
     *
     * @param state
     * @param config
     */
    shellyAccessToken: function(state, config) {
        if (state && state.shellyAccessToken) {
            //log.debug(`shellyAccessToken, state=${JSON.stringify(state)}`);
            return state.shellyAccessToken;
        }
        else {
            //log.debug(`shellyAccessToken, config=${JSON.stringify(config)}`);
            return config.shellyAccessToken[0].stringConfig.value;
        }
    }
};

function deviceProfileId(light) {
    log.debug(`deviceProfileId(${JSON.stringify(light)})`);
    let result = deviceProfiles.white;
    if (light.product.capabilities.has_color) {
        result = deviceProfiles.color;
    }
    else if (light.product.capabilities.has_variable_color_temp) {
        result = deviceProfiles.colorTemp;
    }
    log.debug(`profileId=${result}`);
    return result;
}