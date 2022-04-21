import { setContext } from "@apollo/client/link/context";

import { loadOAuthFromStorage } from "../../AuthorizationPersistentStorage";
import { OAuthData } from "../../OAuthData";

export interface OAuthApolloOperationContext {
    oAuth: OAuthData | null;
}

/**
 * load persistent stored oAuth information from local storage and sets an oAuth object on the apollo context
 */
export const setOAuthContext = setContext((request, prevContext) => {
    const oAuth = loadOAuthFromStorage();
    const oAuthContext: OAuthApolloOperationContext = {
        oAuth: oAuth,
    };
    return { ...prevContext, ...oAuthContext };
});
