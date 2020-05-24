import { InitialLoadResponse, Profile, IApiResponse } from "./App.types";
import { SERVER_URL, SERVER_PORT, DEFAULT_PAD_ID } from "./App.constants";

export async function getInitialLoad():Promise<InitialLoadResponse> {
    let initialLoadResponse: InitialLoadResponse | null = null;
    await fetch(`http://${SERVER_URL}:${SERVER_PORT}/?padId=${DEFAULT_PAD_ID}`)
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