import * as React from "react";

import { AuthorizationManager } from "./createAuthorizationManager";
import { OAuthData } from "./OAuthData";

/*
 * returns the stored oAuth information
 * */
export function useOAuth(authorizationManager: AuthorizationManager): OAuthData | null {
    const [oAuth, setOAuth] = React.useState<OAuthData | null>(null);
    React.useEffect(() => {
        const subscription = authorizationManager.onOAuthChange(() => {
            if (authorizationManager.state.oAuth != null) {
                setOAuth(authorizationManager.state.oAuth);
            } else {
                setOAuth(null);
            }
        });
        return () => {
            subscription.unsubscribe();
        };
        /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, []);
    return oAuth;
}
