import * as React from "react";

import { AuthorizationManager } from "./createAuthorizationManager";
import { UserProfile } from "./types";

/*
 * returns the users profile, decoded from the idToken from the oAuth Process
 * */
export function useUser(authorizationManager: AuthorizationManager): UserProfile | null {
    const [user, setUser] = React.useState<UserProfile | null>(authorizationManager.state.userProfile ?? null);
    React.useEffect(() => {
        const subscription = authorizationManager.onOAuthChange(() => {
            if (authorizationManager.state.userProfile != null) {
                setUser(authorizationManager.state.userProfile);
            } else {
                setUser(null);
            }
        });
        return () => {
            subscription?.unsubscribe();
        };
        /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, []);
    return user;
}
