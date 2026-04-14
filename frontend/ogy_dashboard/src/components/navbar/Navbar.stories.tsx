import type { Meta, StoryObj } from "@storybook/react-vite";
import { Provider as AuthProvider } from "@amerej/artemis-react";
import Navbar from "./Navbar";
import Warning from "@components/warning/Warning";

const meta: Meta<typeof Navbar> = {
  title: "Layout/Navbar",
  component: Navbar,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <AuthProvider>
        <Story />
      </AuthProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Navbar>;

export const Default: Story = {};

export const RoundedTop: Story = {
  args: { roundedTop: true },
  parameters: {
    backgrounds: { default: "dark" },
  },
};

export const WithScrollableContent: Story = {
  parameters: {
    layout: "fullscreen",
  },
  render: () => (
    <div
      className="flex flex-col min-h-screen bg-background"
      style={{
        background:
          "linear-gradient(to bottom, #222526 0, #222526 58px, rgb(var(--color-background)) 58px)",
      }}
    >
      <Warning />
      <Navbar roundedTop />
      <div className="flex-grow w-full bg-background">
        <div className="max-w-[1440px] mx-auto px-6 py-12 space-y-6">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-[#E1E1E1] p-8"
            >
              <h2 className="font-bold text-xl text-content mb-2">
                Section {i + 1}
              </h2>
              <p className="text-muted text-sm">
                Scroll up and down to see the navbar hide on scroll-down,
                reappear on scroll-up, and the rounded top corners fade as
                you scroll past the warning banner.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};
