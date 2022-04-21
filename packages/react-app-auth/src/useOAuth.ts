import * as React from "react";

import { useAuthorization } from "./authorizationcontext/useAuthorization";
import { OAuthData } from "./OAuthData";

/*
 * returns the stored oAuth information
 * */
export function useOAuth(): OAuthData | null {
    const authorization = useAuthorization();

    const [oAuth, setOAuth] = React.useState<OAuthData | null>(null);
    React.useEffect(() => {
        const subscription = authorization?.authorizationManager.onOAuthChange(() => {
            if (authorization?.authorizationManager.state.oAuth != null) {
                setOAuth(authorization?.authorizationManager.state.oAuth);
            } else {
                setOAuth(null);
            }
        });
        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [authorization]);
    return oAuth;
}
