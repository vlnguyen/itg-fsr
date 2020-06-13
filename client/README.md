# Web Client for Setting FSR Thresholds
## Table of Contents
- [Web Client for Setting FSR Thresholds](#web-client-for-setting-fsr-thresholds)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Setup](#setup)
    - [Dependencies](#dependencies)
    - [Configure Constants](#configure-constants)
    - [Start the Client](#start-the-client)
  - [Design Note](#design-note)

## Introduction
The web client is a basic Typescript React app that creates an interface for user profile management and manging pad sensitivities. It hits endpoints stood up by [this server](https://github.com/vlnguyen/itg-fsr/tree/master/server), which interacts directly with Arduino serial streams.

## Setup
### Dependencies
This client runs `node` to be installed. [The flask server](https://github.com/vlnguyen/itg-fsr/tree/master/server) should be setup running first.

### Configure Constants
In `src/App.constants.ts`, there are three constants that should be set.
- `SERVER_URL`: The IP or address of the flask server.
  - If you are hosting the client on the same network as the server, this can be a local IP.
  - If you are hosting the client on a different network than the server, then this must be as public, external IP.
- `SERVER_PORT`: The port that the flask server is running on.
- `DEFAULT_PAD_SIDE`: When set to `PadSide.P1` or `PadSide.P2`, this will determine which pad side is selected when the app is opened.

### Start the Client
Navigate to the client directory.
```bash
cd client
```
Install the app, then run the client.
```bash
npm install
npm run start
```

## Design Note
I've used React before but never with the existing pattern of managing state with `useState<>()`. I'm pretty sure I'm supposed to be utilizing React Hooks a lot more to detect state changes and what to do after, but instead all I've done is create render functions that take in a big param list of all of the state variables and the function that changes those state variables.

There's a lot of opportunity for cleanup and to start utilizing hooks more, but like I mentioned in my [hardware setup guide](https://github.com/vlnguyen/itg-fsr/blob/master/fsr/README.md), I cared a lot more about getting something out there that works than worrying too much about the details in the fabric. Improvement is an iterative process! There will always be an opportunity to make things better.