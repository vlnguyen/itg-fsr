export interface IApiResponse {
    message: string;
    success: boolean;
}

export enum Arrows {
    NONE = -1,
    LEFT = 0,
    DOWN = 1,
    UP = 2,
    RIGHT = 3
}

export enum ProfileControlStatus {
    NONE = -1,
    RENAME,
    CREATE,
    DELETE
}

export enum PadSide {
    P1 = 1,
    P2 = 2
}

export class InitialLoadResponse implements IApiResponse {
    constructor(data: any) {
        this.message = data.message;
        this.success = data.success;
        this.pad = new Pad(
            data.pad.id, 
            data.pad.name, 
            new Profile(
                data.pad.profile.id, 
                data.pad.profile.name, 
                data.pad.profile.values
            )
        );
        this.profiles = data.profiles.map((profile:any) => 
            new Profile(profile.id, profile.name, profile.values)
        );
        this.thresholds = data.thresholds;
    }
    message: string;
    success: boolean;
    pad: Pad;
    profiles: Profile[];
    thresholds: number[];
}

export class SetThresholdsOnPadRequest {
    constructor(padId: number, profile: Profile, values: number[]) {
        this.padId = padId;
        this.profile = profile;
        this.values = values;
    }
    padId: number;
    profile: Profile;
    values: number[];
}

export class CreateNewProfileResponse implements IApiResponse {
    constructor(message: string, success: boolean, profile: Profile) {
        this.message = message;
        this.success = success;
        this.profile = profile;
    }
    message: string;
    success: boolean;
    profile: Profile;
}

export class Pad {
    constructor(id: number, name: string, profile: Profile) {
        this.id = id;
        this.name = name;
        this.profile = profile;
    }
    id: number;
    name: string;
    profile: Profile;
}

export class Profile {
    constructor(id: number, name: string, values: number[]) {
        this.id = id;
        this.name = name;
        this.values = values;
    }
    id: number;
    name: string;
    values: number[];
}

