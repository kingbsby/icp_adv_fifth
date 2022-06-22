import { icp_adv_fifth } from "../../declarations/icp_adv_fifth";
import { Actor, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { renderIndex } from "./views";
import { renderLoggedIn } from "./views/loggedIn";

const IIs_server_url = process.env.NODE_ENV === "production"? "https://identity.ic0.app/" : "http://localhost:8000/?canisterId=rkp4c-7iaaa-aaaaa-aaaca-cai";

const init = async () => {
    console.log("ENV : " + process.env.NODE_ENV + " url:" + IIs_server_url);
    const authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
        handleAuthenticated(authClient);
    }
    renderIndex();
    const loginButton = document.getElementById("loginButton");
    console.log(loginButton);
    loginButton.onclick = async () => {
        await authClient.login({
            identityProvider: IIs_server_url,
            maxTimeToLive: BigInt(24) * BigInt(3_600_000_000_000),
            onSuccess: async () => {
                handleAuthenticated(authClient);
            },
        });
    };
};

async function handleAuthenticated(authClient) {
    const identity = await authClient.getIdentity();
    const agent = new HttpAgent({ identity });
    console.log(process.env.CANISTER_ID);
    // const whoami_actor = Actor.createActor<_SERVICE>(idlFactory, {
    //   agent,
    //   canisterId: process.env.CANISTER_ID,
    // });
    renderLoggedIn(icp_adv_fifth, authClient);
}

init();