# Shelly SmartThings Connector

This is a fully cloud-to-cloud connection between [Shelly](https://shelly-api-docs.shelly.cloud/#shelly1-1pm-status) devices and SmartThings.  It is written as a SmartApp operating by way of an AWS lambda function.  As this is fully cloud-to-cloud, a SmartThings hub is *not* required and your Shelly's *must* be running "stock" firmware and configured to be cloud accessible (ie, with MQTT disabled).

Set-up Instructions:
See the ReadMe in the functions/connector folder

Current limitations:
- Only Shelly 1/PM and Shelly 2.5 are supported
- States are only tracked in SmartThings based on commands sent from within SmartThings and periodic automatic refreshes (every 5 mintues).  This means that if you turn something on via the Shelly app, Shelly API, Alexa, or any other method except through SmartThings, SmartThings won't know anything happened until up to five minutes later.
