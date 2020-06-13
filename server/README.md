# Server for Controlling FSR Sensitivities
## Table of Contents
- [Server for Controlling FSR Sensitivities](#server-for-controlling-fsr-sensitivities)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Setup](#setup)
    - [Install Dependencies](#install-dependencies)
    - [Configure Constants](#configure-constants)
      - [Server Port](#server-port)
      - [Serial Ports](#serial-ports)
    - [Start the Server](#start-the-server)
      - [Test the Server](#test-the-server)
      - [Test the Serial Connection](#test-the-serial-connection)
  - [Usage](#usage)
  - [Documentation](#documentation)
    - [Database Schema](#database-schema)
      - [Profile](#profile)
      - [Pad](#pad)
    - [API - Endpoints](#api---endpoints)
        - [Index](#index)
          - [GET /](#get-)
      - [Thresholds](#thresholds)
        - [GET /thresholds](#get-thresholds)
        - [POST /thresholds](#post-thresholds)
      - [Pressures](#pressures)
        - [GET /pressures](#get-pressures)
      - [Profiles](#profiles)
        - [GET /profiles](#get-profiles)
        - [PUT /profiles](#put-profiles)
        - [POST /profiles](#post-profiles)
        - [DELETE /profiles](#delete-profiles)
      - [Pads](#pads)
        - [GET /pads](#get-pads)
  - [Known Issues, Limitations](#known-issues-limitations)

## Introduction
This server, powered by flask and sqlite, does two things.
- Sets up a local database for storing user profiles and sensor threshold values.
- Creates API endpoints for interacting with the Arduino and the local database.

## Setup

### Install Dependencies
This project requires **Python** and depends on the following modules:
- flask
- flask_cors
- sqlite3

### Configure Constants
#### Server Port
You can ran the server on a different port by changing the value on the variable `SERVER_PORT` at the top of `server.py`.

#### Serial Ports
At the top of `server.py`, set the variable `P1_PORT` to a string that states which COM port the Arduino is connected to. This is discoverable through the Arduino IDE or on your computer's device manager.

At most two pads are supported. If you have a second pad, you may also define a COM port for the variable `P2_PORT`.

If you are only using a single pad, comment out the `serial_p2` initializations by adding a `#` in front of each line. Doing this allows the server to fail gracefully any time there's an attempt to read from the non-existent pad.
```python
# serial_p2 = serial.Serial()
# serial_p2.port = P2_PORT
# serial_p2.baudrate = 9600
# serial_p2.setDTR(False)
# serial_p2.open()
```

### Start the Server
Navigate to the server directory.
```bash
cd server
```
Then run the server.
```bash
python server.py
```
When the server is run for the first time it will initialize a local database `profiles.db` at the location of execution. If you ran the change directory `cd` command first, the database will be found in the `server` folder.

You can access the server on `localhost`. If you want to hit the server from another device on the same network, use the local IP of the computer that the server is hosted on.

#### Test the Server
On a browser or in an API tester like Postman, hit the endpoint `http://localhost:5555/profiles?id=1` and see that you get a response saying that you successfully retrieved a profile.

#### Test the Serial Connection
While standing on a panel and applying pressure to an FSR, hit the endpoint `http://localhost:5555/pressures?padSide=1` and see if one of the values in the returned list is significantly higher than the others.

If you're using two pads, you can run the same test on the other pad, and replacing the query string with `?padSide=2`.

## Usage
It's recommended that you use the server in conjunction with the frontend client, however it is possible to adjust the sensor thresholds and interact with the Arduino without it. You only need to interact with the following endpoints:
- [GET /thresholds](#get-thresholds)
- [POST /thresholds](#post-thresholds)
- [GET /pressures](#get-pressures)

The server provides a general API, so you may build your own client on top of this as well.

## Documentation
### Database Schema
The database consists of two tables, `Profiles` and `Pads`.

#### Profile
A record in `Profiles` describes a user and their FSR sensitivities per analog pin.
```sql
CREATE TABLE IF NOT EXISTS profiles (
    id integer PRIMARY KEY AUTOINCREMENT,
    name text NOT NULL,
    pin0 integer NOT NULL,
    pin1 integer NOT NULL,
    pin2 integer NOT NULL,
    pin3 integer NOT NULL
); 
```

#### Pad
A `Pad` describes a pad and which `Profiles` record is currently assigned to it. A pad's threshold values can be pulled by joining on the `Profiles` table by `Profiles.id` and `Pads.profileId`.
```sql
CREATE TABLE IF NOT EXISTS pads (
    id integer PRIMARY KEY AUTOINCREMENT,
    name text NOT NULL,
    profileId integer NOT NULL,
    FOREIGN KEY(profileId) REFERENCES profiles(id)
); 
```
When the server is first initialized, two records are automatically inserted into this table, one for P1 and the other for P2. It is not supported at this time to allow more than two pads, so there is also no need to add more records to this table.

### API - Endpoints
- All API responses contain a `message` string and a `success` boolean.
- When `values` are returned with a list of pressures or thresholds, it is expected that the array is of length 4 and that the order of the values is Left, Down, Up, then Right.

##### Index
###### GET /
- **Description:** Returns a list of profiles, two pads, and the profiles that are assigned to each pad.
- **Request:** ---
- **Response:** 
```ts
{
    'message': string,
    'success': boolean,
    'p1': {
        'id': number,
        'name': string,
        'profile': {
            'id': number,
            'name': string,
            'values': number[]
        }
    },
    'p2': {
        'id': number,
        'name': string,
        'profile': {
            'id': number,
            'name': string,
            'values': number[]
        }
    },
    'profiles': [
        {
            'id': number,
            'name': string,
            'values': number[]
        }
    ],
}
```

#### Thresholds
##### GET /thresholds
- **Description**: Given a pad side, 1 or 2, return a list of the current sensor thresholds.
- **Request**: Query string `&padSide=1` or `&padSide=2`
- **Response:**
```ts
{
    'message': string,
    'success': boolean,
    'values': number[]
}
```
##### POST /thresholds
- **Description:** Assigns a profile to a given pad side and sets new sensor threshold values. The threshold values used *do not* have to match the values assigned to the profile, and 
- **Request:** 
```ts
{
    'padSide': number,
    'profile': {
        'id': number,
        'name': string
    },
    'values': number[]
}
```
- **Response:**
```ts
{
    'message': string,
    'success': boolean
}
```

#### Pressures
##### GET /pressures
- **Description:** Returns a message describing how much pressure is currently being applied to all sensors on a given pad side, 1 or 2.
- **Request**: Query string `&padSide=1` or `&padSide=2`
- **Response:**
```ts
{
    'message': string,
    'success': boolean
}
```

#### Profiles
##### GET /profiles
- **Description:** Returns a list of all profiles and their sensor thresholds. When supplied with a profile id, it will return one profile if one with a matching id is found. Even if a profile id is specified, the profiles will return in a list.
- **Request:** None, or a query string `id=<PROFILE_ID>`
- **Response:**
```ts
{
    'message': string,
    'success': boolean,
    'profiles': [
        {
            'id': number,
            'name': string,
            'values': number[]
        }
    ]
}
```
##### PUT /profiles
- **Description:** Creates a new profile and returns the newly created profile.
- **Request:**
```ts
{
    'name': string,
    'values': number[]
}
```
- **Response:**
```ts
{
    'message': string,
    'success': boolean,
    'profile': {
        'id': number,
        'name': string,
        'values': number[]
    }
}
```
##### POST /profiles
- **Description:** Updates an existing profile. Returns a message stating the name of the profile that was updated if it was found, and whether the update succeeded.
- **Request:**
```ts
{
    'id': number,
    'name': string,
    'values': number[]
}
```
- **Response:**
```ts
{
    'message': string,
    'success': boolean
}
```
##### DELETE /profiles
- **Description:** Deletes a profile when provided with a profile id.
- **Request:** Query string `?id=<PROFILE_ID>`
- **Response:**
```ts
{
    'message': string,
    'success': boolean
}
```

#### Pads
##### GET /pads
- **Description:** Returns a list of all pads and their assigned profiles and sensor thresholds. When supplied with a pad id, it will return one pad if one with a matching id is found. Even if a pad id is specified, the pads will return in a list.
- **Request:** None, or a query string `id=<PAD_ID>`
- **Response:**
```ts
{
    'message': string,
    'success': boolean,
    'pads': [
        {
            'id': number,
            'name': string,
            'profileId': number,
            'thresholds': number[]
        }
    ]
}
```

## Known Issues, Limitations
- The server can only handle one interaction with the Arudino's serial stream at a time. There is unexpected behavior if another serial command is sent before another has completed. The following endpoints can only be run one at a time.
  - [GET /thresholds](#get-thresholds)
  - [POST /thresholds](#post-thresholds)
  - [GET /pressures](#get-pressures)