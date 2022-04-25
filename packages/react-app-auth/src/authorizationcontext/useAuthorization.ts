import * as React from "react";

import { AuthorizationContext, AuthorizationContextValues } from "./AuthorizationContext";

export function useAuthorization(): AuthorizationContextValues | undefined {
    return React.useContext(AuthorizationContext);
}
