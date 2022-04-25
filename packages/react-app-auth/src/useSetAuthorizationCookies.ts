import * as Cookies from "js-cookie";
import { CookieAttributes } from "js-cookie";
import * as React from "react";

import { AuthorizationManager } from "./createAuthorizationManager";

interface UseSetAuthorizationCookiesOptions {
    authorizationManager: AuthorizationManager;
    accessTokenCookieName: string;
    accessTokenCookieDomain: string;
    accessTokenCookieOptions?: CookieAttributes;
}

const removePortFromDomainName = (domain: string) => {
    //Remove the port for localhost
    const domainParts = domain.split(":");
    if (domainParts.length > 1) {
        domain = domain.split(":")[0];
    }

    return domain;
};

/*
 * sets the cookies for passed domain
 * */
export function useSetAuthorizationCookies({
    accessTokenCookieDomain,
    accessTokenCookieName,
    authorizationManager,
    accessTokenCookieOptions = { domain: removePortFromDomainName(accessTokenCookieDomain), sameSite: "Lax" },
}: UseSetAuthorizationCookiesOptions) {
    React.useEffect(() => {
        const subscription = authorizationManager.onOAuthChange((value) => {
            if (accessTokenCookieDomain && accessTokenCookieName) {
                console.warn('react-oidc-client: "accessTokenCookieName" is deprecated. Use onLoadUser with you own handler instead.');
                if (value) {
                    Cookies.set(accessTokenCookieName, value.accessToken, accessTokenCookieOptions);
                } else {
                    Cookies.remove(accessTokenCookieName);
                }
            }
        });
        return () => {
            subscription.unsubscribe();
        };
    }, [accessTokenCookieDomain, accessTokenCookieName, accessTokenCookieOptions, authorizationManager]);
}
