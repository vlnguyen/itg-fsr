import { InitialLoadResponse } from "./App.types";
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