import { TokenType } from "@openid/appauth";

export interface OAuthData {
    accessToken: string;
    tokenType: TokenType;
    expiresIn: number | undefined;
    refreshToken: string | undefined;
    scope: string | undefined;
    idToken: string | undefined;
    issuedAt: number;
}

export const isOAuthData = (oAuth: unknown): oAuth is OAuthData => {
    return (
        (oAuth as OAuthData).accessToken !== undefined && (oAuth as OAuthData).tokenType !== undefined && (oAuth as OAuthData).issuedAt !== undefined
    );
};
