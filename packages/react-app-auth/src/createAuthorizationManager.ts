import {
    AuthorizationNotifier,
    AuthorizationRequest,
    AuthorizationServiceConfiguration,
    BaseTokenRequestHandler,
    DefaultCrypto,
    FetchRequestor,
    GRANT_TYPE_REFRESH_TOKEN,
    LocalStorageBackend,
    RedirectRequestHandler,
    RevokeTokenRequest,
    StringMap,
    TokenRequest,
} from "@openid/appauth";
import jwtDecode from "jwt-decode";
import { BehaviorSubject, Subject, Subscription } from "rxjs";

import { loadOAuthFromStorage, postLoginUrl, saveOAuthToStorage, savePostLoginUrl } from "./AuthorizationPersistentStorage";
import { NoHashQueryStringUtils } from "./noHashQueryStringUtils";
import { OAuthData } from "./OAuthData";
import { AuthConfiguration, AuthError, UserProfile } from "./types";

export interface AuthorizationManager {
    authorizationConfig: AuthConfiguration;
    readonly state: {
        oAuth: OAuthData | null;
        userProfile: UserProfile | null;
    };
    signIn: (overrideAuthConfiguration: Partial<AuthConfiguration>) => Promise<void>;
    onOAuthChange: (next: (value: OAuthData | null) => void) => Subscription;
    saveOAuth: (oauth: OAuthData | null) => Promise<void>;
    signOut: () => Promise<void>;
    refresh: () => Promise<OAuthData>;
    isProcessingToken: (location: Location) => boolean;
}

export interface CreateAuthorizationManagerOptions {
    authorizationConfig: AuthConfiguration;
    isProcessingToken?: (location: Location) => boolean;
}
export const createAuthorizationManager = ({
    authorizationConfig,
    isProcessingToken = (location) => {
        return window.location.href.startsWith(authorizationConfig.redirectUrl ?? "");
    },
}: CreateAuthorizationManagerOptions): AuthorizationManager => {
    const state: AuthorizationManager["state"] = {
        oAuth: null,
        userProfile: null,
    };

    const signOutSubject = new Subject<void>();
    const oAuthSubject = new BehaviorSubject<OAuthData | null>(null);

    const setOAuthState = (oAuth: OAuthData | null) => {
        state.oAuth = oAuth;
        state.userProfile = oAuth?.idToken ? jwtDecode<UserProfile>(oAuth.idToken) : null;
        oAuthSubject.next(oAuth);
    };

    const oAuth = loadOAuthFromStorage();
    setOAuthState(oAuth);

    const saveOAuth = async (oAuth: OAuthData | null): Promise<void> => {
        await saveOAuthToStorage(oAuth);
        setOAuthState(oAuth);
    };

    const tokenHandler = new BaseTokenRequestHandler(new FetchRequestor());
    const authorizationHandler = new RedirectRequestHandler(
        new LocalStorageBackend(),
        new NoHashQueryStringUtils(),
        window.location,
        new DefaultCrypto(),
    );

    const notifier = new AuthorizationNotifier();
    authorizationHandler.setAuthorizationNotifier(notifier);

    notifier.setAuthorizationListener((request, response, error) => {
        if (error) {
            console.error("AuthorizationError", error);
        }
        if (response) {
            let extras: StringMap | undefined = undefined;
            if (request && request.internal) {
                extras = {
                    code_verifier: request.internal.code_verifier,
                };
            }
            const tokenRequest = new TokenRequest({
                client_id: authorizationConfig.clientId,
                redirect_uri: authorizationConfig.redirectUrl,
                grant_type: "authorization_code",
                code: response.code,
                extras,
            });
            AuthorizationServiceConfiguration.fetchFromIssuer(authorizationConfig.issuer, new FetchRequestor())
                .then((response) => {
                    return tokenHandler.performTokenRequest(response, tokenRequest);
                })
                .then((response) => {
                    saveOAuth(response);

                    const redirectUrl = postLoginUrl();
                    if (redirectUrl) {
                        savePostLoginUrl(null);
                        window.location.replace(redirectUrl);
                    }
                })
                .catch((error) => {
                    console.error("Error", error);
                });
        }
    });

    // if redirect url matches configuration and code parameter is available then go further with the authorization process
    if (isProcessingToken(window.location)) {
        const params = new URLSearchParams(window.location.search);
        if (params.get("code")) {
            try {
                authorizationHandler.completeAuthorizationRequestIfPossible();
            } catch (e) {
                console.error("Error: ", e);
            }
        }
    }

    return {
        authorizationConfig,
        state,
        signIn: (overrideAuthConfiguration: Partial<AuthConfiguration>) => {
            const mergedAuthConfig = { ...authorizationConfig, ...overrideAuthConfiguration };

            return new Promise((resolve, reject) => {
                try {
                    AuthorizationServiceConfiguration.fetchFromIssuer(authorizationConfig.issuer, new FetchRequestor())
                        .then((response) => {
                            savePostLoginUrl(window.location.href);
                            const authRequest = new AuthorizationRequest({
                                client_id: mergedAuthConfig.clientId,
                                redirect_uri: mergedAuthConfig.redirectUrl,
                                scope: mergedAuthConfig.scope,
                                response_type:
                                    mergedAuthConfig.responseType === "code"
                                        ? AuthorizationRequest.RESPONSE_TYPE_CODE
                                        : AuthorizationRequest.RESPONSE_TYPE_TOKEN,
                                state: undefined,
                                extras: mergedAuthConfig.extras,
                                // extras: environment.extra
                            });
                            authorizationHandler.performAuthorizationRequest(response, authRequest);
                            resolve();
                        })
                        .catch((error) => {
                            console.error("Can not fetch Open ID Config from Issuer", error);
                            const authError: AuthError = {
                                code: "invalid_issuer",
                                name: "Invalid Issuer",
                                message: `Can not fetch OpenID Config from Issuer ${authorizationConfig.issuer}`,
                                origin: error,
                            };
                            reject(authError);
                        });
                } catch (error) {
                    const authError: AuthError = {
                        code: "invalid_issuer",
                        name: "Invalid Issuer",
                        message: `Can not fetch OpenID Config from Issuer ${authorizationConfig.issuer}`,
                        origin: error,
                    };
                    reject(authError);
                }
            });
        },
        onOAuthChange: (next: (value: OAuthData | null) => void) => {
            return oAuthSubject.subscribe(next);
        },
        saveOAuth,
        signOut: async () => {
            if (authorizationConfig) {
                const config = await AuthorizationServiceConfiguration.fetchFromIssuer(authorizationConfig.issuer, new FetchRequestor());
                if (state.oAuth?.accessToken) {
                    const revokeAccessTokenRequest = new RevokeTokenRequest({
                        client_id: authorizationConfig.clientId,
                        token: state.oAuth.accessToken,
                        token_type_hint: "access_token",
                    });

                    try {
                        await tokenHandler.performRevokeTokenRequest(config, revokeAccessTokenRequest);
                    } catch (e) {
                        console.warn("Error revoking access token");
                    }
                }

                if (state.oAuth?.refreshToken) {
                    const revokeRefreshTokenRequest = new RevokeTokenRequest({
                        client_id: authorizationConfig.clientId,
                        token: state.oAuth.refreshToken,
                        token_type_hint: "refresh_token",
                    });

                    try {
                        await tokenHandler.performRevokeTokenRequest(config, revokeRefreshTokenRequest);
                    } catch (e) {
                        console.warn("Error revoking refresh token");
                    }
                }
            }

            await saveOAuth(null);
            signOutSubject.next();
        },
        refresh: async () => {
            return new Promise<OAuthData>((resolve, reject) => {
                if (state.oAuth?.refreshToken) {
                    const request = new TokenRequest({
                        client_id: authorizationConfig.clientId,
                        redirect_uri: authorizationConfig.redirectUrl,
                        grant_type: GRANT_TYPE_REFRESH_TOKEN,
                        code: undefined,
                        refresh_token: state.oAuth.refreshToken,
                        extras: undefined,
                    });
                    AuthorizationServiceConfiguration.fetchFromIssuer(authorizationConfig.issuer, new FetchRequestor())
                        .then((response) => {
                            return tokenHandler.performTokenRequest(response, request);
                        })
                        .then((response) => {
                            saveOAuth(response);
                            resolve(response);
                        })
                        .catch((error) => {
                            console.error("Error", error);
                            reject(`can not refresh Token - error occured${JSON.stringify(error)}`);
                        });
                } else {
                    reject("can not refresh Token because there is no refresh_token");
                }
            });
        },
        isProcessingToken: isProcessingToken,
    };
};
