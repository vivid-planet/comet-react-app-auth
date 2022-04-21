import SecureLS from "secure-ls";

import { isOAuthData, OAuthData } from "./OAuthData";

const secureLocalStorage = new SecureLS({ encodingType: "aes" });

// OAuth
export const saveOAuthToStorage = async (oAuth: OAuthData | null) => {
    if (oAuth != null) {
        secureLocalStorage.set("oAuth", JSON.stringify(oAuth));
    } else {
        secureLocalStorage.set("oAuth", null);
    }
};

export const loadOAuthFromStorage = (): OAuthData | null => {
    const value = secureLocalStorage.get("oAuth");
    if (value != null && value.toString().length > 0) {
        try {
            const parsedJson = JSON.parse(value);
            if (isOAuthData(parsedJson)) {
                return parsedJson;
            }
        } catch (e) {
            console.error("Can not parse oauth information from storage: ", e);
        }

        return null;
    } else {
        return null;
    }
};

export const savePostLoginUrl = async (postLoginUrl: string | null) => {
    if (postLoginUrl != null) {
        window.localStorage.setItem("postLoginUrl", postLoginUrl);
    } else {
        window.localStorage.removeItem("postLoginUrl");
    }
};

export const postLoginUrl = (): string | null => {
    if (postLoginUrl != null) {
        return window.localStorage.getItem("postLoginUrl");
    }
    return null;
};
