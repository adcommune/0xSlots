import { defineConfig } from "vocs";

export default defineConfig({
  title: "0xSlots",
  description: "Collectively Owned Slots Protocol",
  ogImageUrl:
    "https://vocs.dev/api/og?logo=%logo&title=%title&description=%description",
  iconUrl: "/logo.png",
  theme: {
    accentColor: "#000000",
  },
  font: {
    google: "Roboto",
  },
  topNav: [
    { text: "Overview", link: "/overview" },
    { text: "SDK", link: "/sdk/client" },
    {
      text: "GitHub",
      link: "https://github.com/nezz0746/0xSlots",
    },
  ],
  sidebar: [
    {
      text: "Introduction",
      items: [
        { text: "Overview", link: "/overview" },
        { text: "Getting Started", link: "/getting-started" },
      ],
    },
    {
      text: "Protocol",
      link: "/protocol",
    },
    {
      text: "SDK",
      items: [
        { text: "SlotsClient", link: "/sdk/client" },
        { text: "React Hooks", link: "/sdk/react" },
      ],
    },
    {
      text: "Modules",
      items: [{ text: "Adland", link: "/modules/adland" }],
    },
    {
      text: "Contracts",
      link: "/contracts",
    },
    {
      text: "Subgraph",
      link: "/subgraph",
    },
  ],
});
