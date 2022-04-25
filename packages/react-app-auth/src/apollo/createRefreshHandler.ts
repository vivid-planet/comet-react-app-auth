import { AuthorizationManager } from "../createAuthorizationManager";
import { OAuthData } from "../OAuthData";
import { AuthConfiguration } from "../types";
import { shouldRefreshAccessToken } from "./links/createRefreshTokenLink";

// inspired by: https://able.bio/AnasT/apollo-graphql-async-access-token-refresh--470t1c8

export type PendingRequestCallback = (oAuth: OAuthData) => void;

export interface RefreshHandler {
    readonly state: {
        isRefreshing: boolean;
    };

    pushPendingRequest: (startPendingRequestCallback: PendingRequestCallback) => void;
    startPendingRequests: (oAuth: OAuthData) => void;
    clearPendingRequests: () => void;
    refreshAccessToken: (
        authorizationConfig: AuthConfiguration,
        onOAuthRefreshedCallback: (oAuth: OAuthData) => void,
        oAuth: OAuthData,
    ) => Promise<OAuthData>;
    startAutomaticRefresh: (checkIntervalInSeconds: number) => void;
    stopAutomaticRefresh: () => void;
}

/**
 * The RefreshHandler knows if an access token - refresh is currently in progress.
 * The RefreshHandler is also responsible for temporary storing callback of pending
 * requests which can be temporary stopped from an apollo link and be later on continued
 *
 * After an access token refresh is successfully done, the pending requests can be put
 * back on the link chain where they stopped, via calling startPendingRequests
 *
 *
 * These mechanism is necessary, because of following use case:
 *     - Refresh Token can only be used once.
 *     - if multiple requests are executed in parallel, respectively another request is currently
 *       refreshing the token in case of an expired access_token or an invalidated access token,
 *       then further refreshes of the token should be avoided, because refreshing an access_token with
 *       it's joined refresh_token will invalidate refresh_token and access_token and only the new
 *       access_token and the new refresh_token will be valid.
 *
 * Mechanism inspired by: https://able.bio/AnasT/apollo-graphql-async-access-token-refresh--470t1c8
 * */
export const createRefreshHandler = (authorizationManager: AuthorizationManager): RefreshHandler => {
    let pendingRequests: PendingRequestCallback[] = [];
    const state: RefreshHandler["state"] = {
        isRefreshing: false,
    };

    const setIsRefreshing = (value: boolean) => {
        state.isRefreshing = value;
    };

    const pushPendingRequest = (request: PendingRequestCallback) => {
        pendingRequests.push(request);
    };
    const startPendingRequests = (oAuth: OAuthData) => {
        pendingRequests.map((callback) => {
            return callback(oAuth);
        });
        pendingRequests = [];
    };

    const clearPendingRequests = () => {
        pendingRequests = [];
    };

    const refreshAccessToken = (authorizationConfig: AuthConfiguration, onOAuthRefreshedCallback: (oAuth: OAuthData) => void) => {
        setIsRefreshing(true);
        const refreshPromise = authorizationManager.refresh();

        refreshPromise
            .then((refreshedOAuth) => {
                if (refreshedOAuth.refreshToken) {
                    // set oAuth context, so all following links know new oAuth information
                    onOAuthRefreshedCallback(refreshedOAuth);
                    startPendingRequests(refreshedOAuth);
                    return true;
                } else {
                    console.error("refreshHandler: SignOut User due we do not get a valid refreshToken");
                    authorizationManager.signOut();
                }
            })
            .catch((error) => {
                clearPendingRequests();
                console.error("refreshHandler: refresh error", error);
                authorizationManager.signOut();
                return;
            })
            .finally(() => {
                setIsRefreshing(false);
            });
        return refreshPromise;
    };
    let refreshInterval: ReturnType<typeof setInterval> | null = null;

    return {
        state,
        refreshAccessToken,
        pushPendingRequest,
        startPendingRequests,
        clearPendingRequests,
        startAutomaticRefresh: (checkIntervalInSeconds: number) => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
            refreshInterval = setInterval(async () => {
                if (authorizationManager.state?.oAuth) {
                    if (shouldRefreshAccessToken(authorizationManager.state.oAuth, 60)) {
                        if (!state.isRefreshing) {
                            await refreshAccessToken(authorizationManager.authorizationConfig, (oAuth) => {
                                startPendingRequests(oAuth);
                            });
                        }
                    }
                }
            }, checkIntervalInSeconds * 1000);
        },
        stopAutomaticRefresh: () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        },
    };
};
