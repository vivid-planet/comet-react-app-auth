import { fromPromise } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { Observable } from "@apollo/client/utilities";

import { OAuthData } from "../../OAuthData";
import { AuthConfiguration } from "../../types";
import { RefreshHandler } from "../createRefreshHandler";
import { OAuthApolloOperationContext } from "./setOAuthContext";

export interface CreateOnErrorRefreshTokenLinkOptions {
    authorizationConfig: AuthConfiguration;
    refreshHandler: RefreshHandler;
}

export const createOnErrorRefreshTokenLink = ({ authorizationConfig, refreshHandler }: CreateOnErrorRefreshTokenLinkOptions) => {
    return onError(({ graphQLErrors, operation, forward }) => {
        const { oAuth } = operation.getContext() as OAuthApolloOperationContext;
        if (!oAuth?.refreshToken) {
            console.error("onErrorRefreshTokenLink - No refresh token available");
        }

        if (graphQLErrors) {
            for (const graphQLError of graphQLErrors) {
                if (graphQLError.message === "AccessTokenInvalid") {
                    if (oAuth) {
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
                }
            }
        }
    });
};
