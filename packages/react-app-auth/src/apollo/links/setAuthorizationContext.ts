import { setContext } from "@apollo/client/link/context";

import { OAuthApolloOperationContext } from "./setOAuthContext";

/**
 * add access token to authorization header´
 */
export const setAuthorizationContext = setContext((request, prevContext) => {
    const { oAuth } = prevContext as OAuthApolloOperationContext;

    return {
        headers: {
            ...prevContext.headers,
            ...(oAuth?.accessToken ? { authorization: `Bearer ${oAuth.accessToken}` } : undefined),
        },
    };
});
