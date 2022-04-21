import * as React from "react";

import { useAuthorization } from "./authorizationcontext/useAuthorization";
import { AuthError } from "./types";
import { useUser } from "./useUser";

interface AuthorizationGateProps {
    renderErrorPage: ({ error, onRetry }: { error: string; onRetry: () => void }) => React.ReactNode;
}
export const AuthorizationGate: React.FunctionComponent<AuthorizationGateProps> = ({ children, renderErrorPage }) => {
    const authorization = useAuthorization();
    const isLoggingIn = authorization?.authorizationManager.isProcessingToken(window.location) ?? true;

    const user = useUser();

    const [error, setError] = React.useState<string | null>(null);
    const signIn = React.useCallback(async () => {
        try {
            await authorization?.authorizationManager.signIn({
                extras: {
                    prompt: "login", //always show login
                },
            });
        } catch (error) {
            const authError = error as AuthError;
            setError(authError.message);
        }
    }, [authorization]);

    React.useEffect(() => {
        if (user == null && !isLoggingIn) {
            signIn();
        }
    }, [user, isLoggingIn, signIn]);

    const onRetry = React.useCallback(async () => {
        setError(null);
        await signIn();
    }, [signIn]);

    if (error) {
        return <>{renderErrorPage({ error, onRetry })}</>;
    }
    if (user == null) {
        return null;
    }
    return <>{children}</>;
};
