/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Hackathon color palette
export const HackathonColors = {
  redOrange: "#ff5c4d",
  orange: "#ff9636",
  mimosa: "#ffcd58",
  chartreuse: "#dad870",
  blue: "#38b1f6",
};

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: HackathonColors.blue,
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    // Hackathon colors
    redOrange: HackathonColors.redOrange,
    orange: HackathonColors.orange,
    mimosa: HackathonColors.mimosa,
    chartreuse: HackathonColors.chartreuse,
    blue: HackathonColors.blue,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    // Hackathon colors
    redOrange: HackathonColors.redOrange,
    orange: HackathonColors.orange,
    mimosa: HackathonColors.mimosa,
    chartreuse: HackathonColors.chartreuse,
    blue: HackathonColors.blue,
  },
};
