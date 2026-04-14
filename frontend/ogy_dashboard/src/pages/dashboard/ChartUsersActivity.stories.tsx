import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateTime } from "luxon";
import ChartUsersActivity from "./ChartUsersActivity";
import { withMockedQueries } from "../../../.storybook/withMockedQueries";

const meta: Meta<typeof ChartUsersActivity> = {
  title: "Dashboard/Cards/ChartUsersActivity",
  component: ChartUsersActivity,
};

export default meta;
type Story = StoryObj<typeof ChartUsersActivity>;

const days = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    start_time: { datetime: DateTime.fromISO("2026-04-01").plus({ days: i }) },
    total_unique_accounts: {
      number: 10000 + i * 250,
      string: (10000 + i * 250).toLocaleString("en-US"),
    },
  }));

export const Loaded: Story = {
  decorators: [
    withMockedQueries((qc) => {
      qc.setQueryData(["SUPER_STATS_GET_ACTIVITY_STATS"], days(14));
      qc.setQueryData(["GET_ACTIVE_USERS_COUNT"], {
        active_accounts_count: BigInt(5678),
      });
    }),
  ],
};

export const Loading: Story = {
  decorators: [withMockedQueries(() => {})],
};
