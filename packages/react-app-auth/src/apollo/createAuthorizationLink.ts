import { AuthConfiguration } from "../types";
import { RefreshHandler } from "./createRefreshHandler";
import { createOnErrorRefreshTokenLink } from "./links/createOnErrorRefreshTokenLink";
import { createRefreshTokenLink } from "./links/createRefreshTokenLink";
import { setAuthorizationContext } from "./links/setAuthorizationContext";
import { setOAuthContext } from "./links/setOAuthContext";

export interface CreateAuthorizationLinkOptions {
    authorizationConfig: AuthConfiguration;
    refreshHandler: RefreshHandler;
}

export const createAuthorizationLink = (options: CreateAuthorizationLinkOptions) => {
    return setOAuthContext.concat(createRefreshTokenLink(options)).concat(createOnErrorRefreshTokenLink(options)).concat(setAuthorizationContext);
};
