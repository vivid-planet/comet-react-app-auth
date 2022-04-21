import { ApolloLink, fromPromise } from "@apollo/client";
import { Observable } from "@apollo/client/utilities";
import { addSeconds, differenceInSeconds, fromUnixTime } from "date-fns";

import { OAuthData } from "../../OAuthData";
import { AuthConfiguration } from "../../types";
import { RefreshHandler } from "../createRefreshHandler";
import { OAuthApolloOperationContext } from "./setOAuthContext";

export const shouldRefreshAccessToken = (oAuth: OAuthData, accessTokenExpiringNotificationTime: number) => {
    if (oAuth.expiresIn) {
        const issuedAt = fromUnixTime(oAuth.issuedAt);
        const accessTokenExpirationDate = addSeconds(issuedAt, oAuth.expiresIn);
        const expiresInSeconds = differenceInSeconds(accessTokenExpirationDate, new Date());
        return expiresInSeconds <= accessTokenExpiringNotificationTime;
    } else {
        throw new Error("oAuth information does not have expiresIn data");
    }
};

export interface CreateRefreshTokenLinkOptions {
    authorizationConfig: AuthConfiguration;
    refreshHandler: RefreshHandler;
}

/**
 * uses oauth information form operation context to determine and refresh access token if needed
 *
 *      - Caches concurrently requests and executes requests after access token has been successfully requested
 *      - add new oAuth context to pending requests
 *      - SignOut if access token could not be refreshed successfully
 *
 *  @requires: setOAuthContext in before apollo link chain
 */
export const createRefreshTokenLink = ({ authorizationConfig, refreshHandler }: CreateRefreshTokenLinkOptions) => {
    return new ApolloLink((operation, forward) => {
        const { oAuth } = operation.getContext() as OAuthApolloOperationContext;

        if (!oAuth?.refreshToken) {
            console.error("refreshTokenIfExpired - No refresh token available - can not refresh token");
        }

        if (oAuth && shouldRefreshAccessToken(oAuth, 60)) {
            let forwarding: Observable<unknown> | null = null;

            if (!refreshHandler.state.isRefreshing) {
                forwarding = fromPromise(
                    refreshHandler.refreshAccessToken(
                        authorizationConfig,
                        (refreshedOAuth) => {
                            operation.setContext({
                                oAuth: refreshedOAuth,
                            });
                        },
                        oAuth,
                    ),
                ).filter((value) => Boolean(value));
            } else {
                forwarding = fromPromise(
                    new Promise<void>((resolve) => {
                        refreshHandler.pushPendingRequest((oAuth: OAuthData) => {
                            operation.setContext({ oAuth });
                            return resolve();
                        });
                    }),
                );
            }
            return forwarding.flatMap(() => {
                return forward(operation);
            });
        }

        return forward(operation);
    });
};
