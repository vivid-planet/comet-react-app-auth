import {
    AuthConfiguration,
    AuthorizationGate,
    AuthorizationProvider,
    createAuthorizationManager,
    useAuthorization,
    useOAuth,
    useUser,
} from "@comet/react-app-auth";
import { Meta } from "@storybook/react";
import * as React from "react";

export default {
    title: "Login/with PKCE",
    argTypes: {},
} as Meta;
import { OAuthData } from "@comet/react-app-auth/lib/OAuthData";
import { addSeconds, differenceInSeconds, fromUnixTime } from "date-fns";

const storyPath = "/iframe.html?id=login-with-pkce--vivid-planet-dev-idp&viewMode=story";

const authorizationConfig: AuthConfiguration = {
    issuer: "https://idp-sso.vivid-planet.cloud",
    clientId: "react-app-auth-sample-client",
    redirectUrl: `http://localhost:6006${storyPath}&process-token`,
    responseType: "code",
    scope: "offline openid profile email",
    usePKCE: true,
};

const authorizationManager = createAuthorizationManager({
    authorizationConfig,
    isProcessingToken: (location: Location) => {
        return location.toString().startsWith("http://localhost:6006/iframe.html") && location.toString().includes("process-token");
    },
});

const expiresIn = (oAuth: OAuthData) => {
    if (oAuth.expiresIn) {
        const issuedAt = fromUnixTime(oAuth.issuedAt);
        const accessTokenExpirationDate = addSeconds(issuedAt, oAuth.expiresIn);
        const expiresInSeconds = differenceInSeconds(accessTokenExpirationDate, new Date());
        return expiresInSeconds;
    }
    return -1;
};

const Page: React.FunctionComponent = () => {
    const user = useUser();
    const authorization = useAuthorization();
    const oAuth = useOAuth();
    return (
        <>
            {authorization && (
                <>
                    <h2>Authorization Config</h2>
                    <div>Issuer: {authorization.authorizationManager.authorizationConfig.issuer}</div>
                    <div>ClientId: {authorization.authorizationManager.authorizationConfig.clientId}</div>
                    <div>Scope: {authorization.authorizationManager.authorizationConfig.scope}</div>
                    <div>RedirectUrl: {authorization.authorizationManager.authorizationConfig.redirectUrl}</div>
                </>
            )}
            {user && (
                <>
                    <h2>User is logged in</h2>
                    <div>{user.name}</div>
                    <div>{user.email}</div>
                </>
            )}

            {oAuth && (
                <>
                    <h2>OAuth:</h2>
                    <div>Access Token: {oAuth.accessToken}</div>
                    <div>Issued at: {fromUnixTime(oAuth.issuedAt).toString()}</div>
                    <div>Expires in: {expiresIn(oAuth)} seconds</div>
                    <div>Refresh Token: {oAuth.refreshToken}</div>
                </>
            )}
            <button
                onClick={() => {
                    authorization?.authorizationManager.signOut();
                }}
            >
                Logout
            </button>
        </>
    );
};

interface ErrorPageProps {
    error: string | null;
    onRetry: () => void;
}
const ErrorPage: React.FunctionComponent<ErrorPageProps> = ({ error, onRetry }) => {
    return (
        <div>
            <h1>Error</h1>
            <div>{JSON.stringify(error)}</div>
            <button onClick={onRetry}>Retry</button>
        </div>
    );
};

export const VividPlanetDevIdp = () => {
    return (
        <div>
            {window.self !== window.top ? (
                <div>
                    Authentication Flow does not work in the embeeded iFrame.
                    <div>
                        <a target="_blank" href={storyPath} rel="noreferrer">
                            Go to Login
                        </a>
                    </div>
                </div>
            ) : (
                <AuthorizationProvider authorizationManager={authorizationManager}>
                    <AuthorizationGate
                        renderErrorPage={({ error, onRetry }) => {
                            return <ErrorPage error={error} onRetry={onRetry} />;
                        }}
                    >
                        <Page />
                    </AuthorizationGate>
                </AuthorizationProvider>
            )}
        </div>
    );
};
