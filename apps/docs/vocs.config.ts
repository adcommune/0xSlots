import { defineConfig } from "vocs";

export default defineConfig({
  title: "0xSlots",
  description: "Collectively Owned Slots Protocol",
  ogImageUrl:
    "https://vocs.dev/api/og?logo=%logo&title=%title&description=%description",
  iconUrl: "/icon.svg",
  theme: {
    accentColor: "#a78bfa",
  },
  topNav: [
    { text: "Guide", link: "/getting-started" },
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
        { text: "Overview", link: "/" },
        { text: "Getting Started", link: "/getting-started" },
      ],
    },
    {
      text: "Protocol",
      items: [
        { text: "Architecture", link: "/protocol/overview" },
        { text: "Slots", link: "/protocol/slots" },
        { text: "Tax System", link: "/protocol/tax-system" },
        { text: "Modules", link: "/protocol/modules" },
        { text: "Roles", link: "/protocol/roles" },
      ],
    },
    {
      text: "SDK Reference",
      items: [
        { text: "SlotsClient", link: "/sdk/client" },
        { text: "React Hooks", link: "/sdk/react" },
        { text: "Types", link: "/sdk/types" },
      ],
    },
    {
      text: "Contracts",
      items: [
        { text: "Addresses", link: "/contracts/addresses" },
        { text: "ABIs", link: "/contracts/abis" },
      ],
    },
    {
      text: "Subgraph",
      items: [
        { text: "Overview", link: "/subgraph/overview" },
        { text: "Queries", link: "/subgraph/queries" },
      ],
    },
  ],
});
