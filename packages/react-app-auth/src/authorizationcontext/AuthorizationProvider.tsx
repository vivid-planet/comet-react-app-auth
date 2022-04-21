import * as React from "react";

import { AuthorizationContext, AuthorizationContextValues } from "./AuthorizationContext";

type AuthorizationProviderProps = AuthorizationContextValues;
export const AuthorizationProvider: React.FunctionComponent<AuthorizationProviderProps> = ({ children, ...value }) => {
    return <AuthorizationContext.Provider value={value}>{children}</AuthorizationContext.Provider>;
};
