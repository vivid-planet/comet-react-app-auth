import * as React from "react";

import { useAuthorization } from "./authorizationcontext/useAuthorization";
import { UserProfile } from "./types";

/*
 * returns the users profile, decoded from the idToken from the oAuth Process
 * */
export function useUser(): UserProfile | null {
    const authorization = useAuthorization();
    const [user, setUser] = React.useState<UserProfile | null>(authorization?.authorizationManager.state.userProfile ?? null);
    React.useEffect(() => {
        const subscription = authorization?.authorizationManager.onOAuthChange(() => {
            if (authorization?.authorizationManager.state.userProfile != null) {
                setUser(authorization?.authorizationManager.state.userProfile);
            } else {
                setUser(null);
            }
        });
        return () => {
            subscription?.unsubscribe();
        };
    }, [authorization]);
    return user;
}
