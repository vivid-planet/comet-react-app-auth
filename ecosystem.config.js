module.exports = {
    apps: [
        {
            name: "react-app-auth",
            script: "npx yarn workspace @comet/react-app-auth start",
            namespace: "comet-react-app-auth",
            autorestart: true,
        },
        {
            name: "react-native-app-auth",
            script: "npx yarn workspace @comet/react-native-app-auth start",
            namespace: "comet-react-app-auth",
            autorestart: true,
        },
        {
            name: "storybook",
            script: "npx yarn workspace @comet/react-app-auth-storybook start",
            namespace: "comet-react-app-auth",
            autorestart: true,
        },
    ],
};
