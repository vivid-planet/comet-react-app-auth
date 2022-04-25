import { AuthorizationRequest } from "@openid/appauth";

//TODO: align web - native
export interface OAuthResult {
    accessToken: string;
    accessTokenExpirationDate: string;
    idToken: string;
    refreshToken: string;
    tokenType: string;
    scopes: string[];
    [other: string]: unknown;
}

export type UserProfile = {
    name?: string;
    given_name?: string;
    family_name?: string;
    middle_name?: string;
    email?: string;
    email_verified?: boolean;
    gender?: string;
    birthdate?: string;
    locale?: string;
    updated_at?: number;

    iss: string;
    sub: string;
    aud: string;
    exp: number;
    iat: number;
    auth_time?: number;
    nonce?: number;
    at_hash?: string;
    acr?: string;
    amr?: string[];
    azp?: string;
    sid?: string;

    [claimKey: string]: unknown;
};

export type AuthConfiguration = {
    issuer: string;
    clientId: AuthorizationRequest["clientId"];
    redirectUrl: AuthorizationRequest["redirectUri"];
    scope: AuthorizationRequest["scope"];
    responseType: "code";
    state?: AuthorizationRequest["state"];
    usePKCE: boolean;
    extras?: AuthorizationRequest["extras"];
};

type OIDConfigErrorCode = "invalid_issuer";

type ErrorCode = OIDConfigErrorCode;
export interface AuthError extends Error {
    code: ErrorCode;
    origin?: Error;
}
