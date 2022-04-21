import * as React from "react";

import { AuthorizationManager } from "../createAuthorizationManager";

export interface AuthorizationContextValues {
    authorizationManager: AuthorizationManager;
}
export const AuthorizationContext = React.createContext<AuthorizationContextValues | undefined>(undefined);
