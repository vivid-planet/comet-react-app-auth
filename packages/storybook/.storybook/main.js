module.exports = {
    stories: ["../src/**/*.stories.@(tsx|mdx)"],
    addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
    webpackFinal(config) {
        delete config.resolve.alias["emotion-theming"];
        delete config.resolve.alias["@emotion/styled"];
        delete config.resolve.alias["@emotion/core"];
        return config;
    },
};
