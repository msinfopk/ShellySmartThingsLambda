# SmartThings LIFX C2C Lambda Connector

This project is an example AWS Lambda C2C device connector app that uses the SmartThings API to import LIFX bulbs
into your SmartThings account. It's written in NodeJS and uses [DynamoDB](https://aws.amazon.com/dynamodb/)
for storing LIFX API credentials.


## Folder structure

- config
  - default.json -- Keys, IDs, and other instance specific configuration values
- lib
    - api
        - shelly.js -- Methods for communicating to Shelly Cloud required by this app
        - st.js -- Prototype framework to abstract away some endpoint app implementation details, not specific to this app
    - lifecycle
        - configuration.js -- CONFIGURATION lifecycle event handling
        - crud.js -- INSTALL, UPDATE, and UNINSTALL lifecycle event handling
        - event.js -- EVENT lifecycle handling
        - oauth.js -- OAUTH lifecycle handling
    - local
        - db.js -- Simple DynamoDB-based store of state data for this application
        - log.js -- Simple wrapper around console.log, not specific to this app
- package.json -- Node package file
- server.js -- This application

## Prerequisites

- An [Amazon AWS account](https://portal.aws.amazon.com/billing/signup#/start)
- The [AWS command line tools](https://aws.amazon.com/cli/)
- A [Samsung ID and SmartThings](https://account.smartthings.com/login) account
- A [SmartThings Developer Workspace](https://devworkspace.developer.samsung.com/smartthingsconsole/iotweb/site/index.html#/home) account
- At least one [Shelly Device](https://shelly.cloud) and the Shelly Mobile app (to get a token)
- A Shelly  API Token

## Setup instructions

1. Clone this repository and cd into the resulting directory.

2. Add your Shelly API token into config/default.json.

3. CD into `functions/connector` and install the dependencies with `npm install`.

4. Zip up the contents of the connector folder and upload it to your lambda function as the function code.  Make sure your function code handler is set to "index.handle".

5. Run the following command, substituting your project name for `<your-project-name>`, to give SmartThings permission to run your Lambda:<br/>
`aws lambda add-permission --function-name <your-project-name>_lambda_function --statement-id smartthings --principal 906037444270 --action lambda:InvokeFunction`

6. Log into the SmartThings [Developer Workspace](https://devworkspace.developer.samsung.com/) Create your SmartApp and Devices.

    01. Create a new _New Project_.  Select _Device Integration_ and then _SmartThings Cloud Connector_.  Finally select _SmartApp Connector_.
    02. Enter and save a Service name such as "Shelly Cloud Connector"
    03. Select _AWS Lambda_ as your hosting service.
    04. Paste the Lambda ARN into the _Target URL_ page and click _SAVE AND NEXT_.
    05. In _Name & Scope_ select the _i:deviceprofiles_, _r:devices:*_, _w:devices:*_, _x:devices:*_ and _r:locations:*_ scopes and click _Next_.
    06.  Leave the Advanced Settings at defaults and click _Save_.
    07.  In your project workspace, select "Device Profile".
    08. Click _Add a device profile_ to create a device profile for the Shelly1.
        - Give the device a name such as "Shelly1OS" and an optional description.
        - Set the _Device type_ to _Switch_.
        - Click the plus (+) sign to add capabilities and select the _Switch_ and _Health Check_ capabilities and click _ADD_.
        - Pick the UI that you want to use from the drop down.  I used _Switch_ for both UI elements.
    09. Create another device profile for the Shelly 2.5.
        - Give the device a name such as "Shelly25" and an optional description.
        - Set the _Device type_ to _Switch_.
        - Click the plus (+) sign to add capabilities and select the _Switch_, _Health Check_, _Temperature Measurement_, and _Power Meter_ capabilities and click _ADD_.
        - Pick the UI that you want to use from the drop down.  I used _Switch_ for both UI elements.
    10. [Optional] Create a device profile for the Shelly1PM.  It should have identically capabilities to the 2.5.

7. Update your `config/default.json` file with the app name and the profile id's that you just generated in the SmartThings workspace.

8. Re-zip the contents of your connector folder with the updated config file and reupload it to AWS Lambda.

9. In the SmartThings developer workspace, deploy your SmartApp to Testing

10. On your SmartThings mobile app (__NOT__ the classic app!) enable developer mode following the instructions here:  https://smartthings.developer.samsung.com/docs/testing/developer-mode.html.  Close and restart the app for developer mode to take effect.

11. On the _Devices_ page of the SmartThings mobile app tap _ADD DEVICES_ and then select your device from _My Testing Devices_ all the way at the bottom of the page (you can also install the devices in the ST Classic app from Marketplace -> SmartApps -> My Apps).

12. All of your cloud connected Shelly devices should be found and can be assigned to rooms.  Yay!
