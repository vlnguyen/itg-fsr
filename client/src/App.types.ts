export interface IApiResponse {
    message: string;
    success: boolean;
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

