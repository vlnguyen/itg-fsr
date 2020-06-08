import { InitialLoadResponse, Profile, IApiResponse, SetThresholdsOnPadRequest, CreateNewProfileResponse as CreateProfileResponse } from "./App.types";
import { SERVER_URL, SERVER_PORT, DEFAULT_PAD_SIDE } from "./App.constants";

export async function getInitialLoad():Promise<InitialLoadResponse> {
    let initialLoadResponse: InitialLoadResponse | null = null;
    await fetch(`http://${SERVER_URL}:${SERVER_PORT}/?padId=${DEFAULT_PAD_SIDE}`)
        .then(resp => resp.json())
        .then(data => {
            initialLoadResponse = new InitialLoadResponse(data);
        });
    if (initialLoadResponse) {
        return initialLoadResponse;
    }
    throw Error("Could not fetch initial load.");
}

export async function getPressures():Promise<IApiResponse> {
    let getPressuresResponse: IApiResponse | null = null;
    await fetch(`http://${SERVER_URL}:${SERVER_PORT}/pressures`)
        .then(resp => resp.json())
        .then(data => {
            getPressuresResponse = {
                message: data.message,
                success: data.success
            };
        });
    if (getPressuresResponse) {
        return getPressuresResponse;
    }
    throw Error("Could not get current pressures.");
}

export async function getThresholds():Promise<IApiResponse> {
    let getThresholdsResponse: IApiResponse | null = null;
    await fetch(`http://${SERVER_URL}:${SERVER_PORT}/thresholds`)
        .then(resp => resp.json())
        .then(data => {
            getThresholdsResponse = {
                message: data.message,
                success: data.success
            }
        });
    if (getThresholdsResponse) {
        return getThresholdsResponse;
    }
    throw Error("Could not get current thresholds");
}

export async function setThresholdsOnPad(padId: number, selectedProfile: Profile, thresholds: number[]): Promise<IApiResponse> {
    let setThresholdsOnPadResponse: IApiResponse | null = null;
    const postBody = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            new SetThresholdsOnPadRequest(DEFAULT_PAD_SIDE, selectedProfile, thresholds)
        )
    };
    await fetch(`http://${SERVER_URL}:${SERVER_PORT}/thresholds`, postBody)
        .then(resp => resp.json())
        .then(data => {
            setThresholdsOnPadResponse = {
                message: data.message,
                success: data.success
            }
        })
    if (setThresholdsOnPadResponse) {
        return setThresholdsOnPadResponse;
    }
    throw Error("Could not apply thresholds to pad.");
}

export async function updateProfile(updatedProfile: Profile):Promise<IApiResponse> {
    let saveProfileResponse: IApiResponse | null = null;
    const postBody = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedProfile)
    };

    await fetch(`http://${SERVER_URL}:${SERVER_PORT}/profiles`, postBody)
        .then(resp => resp.json())
        .then(data => {
            saveProfileResponse = {
                message: data.message,
                success: data.success
            }
        });
    if (saveProfileResponse) {
        return saveProfileResponse;
    }
    throw Error("Could not update profile.");
}

export async function deleteProfile(profile: Profile):Promise<IApiResponse> {
    let deleteResponse: IApiResponse | null = null;
    await fetch(`http://${SERVER_URL}:${SERVER_PORT}/profiles?id=${profile.id}`, {method: "DELETE"})
        .then(resp => resp.json())
        .then(data => {
            deleteResponse = {
                message: data.message,
                success: data.success
            }
        });
    if (deleteResponse) {
        return deleteResponse;
    }
    throw Error("Could not delete profile.");  
}

export async function createProfile(newProfile: Profile):Promise<CreateProfileResponse> {
    let createProfileResponse: CreateProfileResponse | null = null;
    const postBody = {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProfile)
    };

    await fetch(`http://${SERVER_URL}:${SERVER_PORT}/profiles`, postBody)
        .then(resp => resp.json())
        .then(data => {
            createProfileResponse = new CreateProfileResponse(
                data.message, 
                data.success, 
                new Profile(data.profile.id, data.profile.name, data.profile.values)
            )
        });
    if (createProfileResponse) {
        return createProfileResponse;
    }
    throw Error("Could not update profile.");
}