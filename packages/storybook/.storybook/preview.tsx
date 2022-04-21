const order = ["components-"];

export const parameters = {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
    backgrounds: {
        disable: true,
    },
    options: {
        storySort: (a, b) => {
            const aName = a[0];
            const bName = b[0];

            const aIdx = order.findIndex((i) => aName.indexOf(i) > -1);
            const bIdx = order.findIndex((i) => bName.indexOf(i) > -1);
            return aIdx - bIdx;

            return aName < bName ? -1 : 1;
        },
    },
};

export const decorators = [
    (Story) => {
        return <Story />;
    },
];
