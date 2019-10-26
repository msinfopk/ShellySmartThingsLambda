'use strict';

const log = require('../local/log');
const shelly = require('../api/shelly');
const st = require('../api/st');
const util = require('../api/util');

/**
 * INSTALL, UPDATE, and UNINSTALL lifecycle events
 */
module.exports = {

    /**
     * Called when the app is first installed after the configuration and permissions page. Creates devices and
     * schedules periodic 5 minute polling of device states.
     */
    install: function(installData) {
        updateDevices(installData, []);
        st.createSchedule(installData.authToken, installData.installedApp.installedAppId, 'poll', '1/5 * * * ? *');
    },

    /**
     * Called any time the configuration page is updated. Creates any new devices that may have been added.
     * If there is more than one location and the selected location is changed, then existing devices are
     * removed and new devices created.
     */
    update: function(updateData) {
        let token = updateData.authToken;
        let locationId = updateData.installedApp.locationId;
        let installedAppId = updateData.installedApp.installedAppId;
        st.listDevices(token, locationId, installedAppId).then(function(list) {
            updateDevices(updateData, list);
        });
    },

    /**
     * Called when the connector is uninstalled. Nothing to do here since the system automatically deletes
     * the devices.
     */
    uninstall: function(uninstallData) {
        log.debug(`${uninstallData.installedApp.installedAppId} connector deleted`);
    }
};

/**
 * Iterates over device lists from SmartThings and Shelly, creating and deleting devices as necessary.
 *
 * @param params Either installData or updateData
 * @param existingDevices List current SmartThings devices for this connector
 */
function updateDevices(params, existingDevices) {
    let installedAppId = params.installedApp.installedAppId;
    let locationId = params.installedApp.locationId;
    let config = params.installedApp.config;

    if (config) {
        // Get the stored Shelly access token (from OAuth journey)
        db.get(installedAppId, function (state) {

            // Query Shelly for list of lights in the selected location
            let shellyAccessToken = util.shellyAccessToken(state, config);
            shelly.getShellys(shellyAccessToken, function (lights) {
                util.reconcileDeviceLists(params.authToken, locationId, installedAppId, lights, existingDevices);
            });
        });
    }
}
