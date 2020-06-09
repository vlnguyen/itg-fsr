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
        this.p1 = new Pad(
            data.p1.id, 
            data.p1.name, 
            new Profile(
                data.p1.profile.id, 
                data.p1.profile.name, 
                data.p1.profile.values
            )
        );
        this.p2 = new Pad(
            data.p2.id, 
            data.p2.name, 
            new Profile(
                data.p2.profile.id, 
                data.p2.profile.name, 
                data.p2.profile.values
            )
        );
        this.profiles = data.profiles.map((profile:any) => 
            new Profile(profile.id, profile.name, profile.values)
        );
        this.thresholds = data.thresholds;
    }
    message: string;
    success: boolean;
    p1: Pad;
    p2: Pad;
    profiles: Profile[];
    thresholds: number[];
}

export class SetThresholdsOnPadRequest {
    constructor(padSide: PadSide, profile: Profile, values: number[]) {
        this.padSide = padSide;
        this.profile = profile;
        this.values = values;
    }
    padSide: PadSide;
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

export class SelectedProfileState {
    constructor(p1: Profile, p2: Profile) {
        this[PadSide.P1] = p1;
        this[PadSide.P2] = p2;
    }
    [PadSide.P1]: Profile;
    [PadSide.P2]: Profile;
}

