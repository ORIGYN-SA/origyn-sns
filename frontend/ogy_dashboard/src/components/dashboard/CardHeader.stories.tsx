import type { Meta, StoryObj } from "@storybook/react-vite";
import CardHeader from "./CardHeader";
import Stat from "./Stat";
import PeriodSelect from "./PeriodSelect";
import { TooltipInfo } from "@components/ui";

const meta: Meta<typeof CardHeader> = {
  title: "Dashboard/CardHeader",
  component: CardHeader,
};

export default meta;
type Story = StoryObj<typeof CardHeader>;

export const TitleOnly: Story = {
  args: {
    title: "Total OGY Supply",
  },
};

export const WithTooltip: Story = {
  args: {
    title: "Total OGY Supply",
    tooltip: (
      <TooltipInfo
        id="story-cardheader-tooltip"
        title="Total amount of OGY tokens available."
      >
        <p>
          This includes the circulating supply and the supply under control
          of the ORIGYN Foundation.
        </p>
      </TooltipInfo>
    ),
  },
};

export const WithSubtitleAndSelect: Story = {
  args: {
    title: "Total OGY Supply",
    tooltip: (
      <TooltipInfo
        id="story-cardheader-full"
        title="Total amount of OGY tokens available."
      >
        <p>Description text in the tooltip body.</p>
      </TooltipInfo>
    ),
    subtitle: (
      <Stat iconSrc="/ogy_logo.svg" value="13,702,526,202" unit="OGY" />
    ),
    right: (
      <PeriodSelect
        options={[
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
        ]}
        value="weekly"
        onChange={() => {}}
      />
    ),
  },
};
