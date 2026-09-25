import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

const meta = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
  args: { type: 'single', defaultValue: 'city', 'aria-label': 'View' },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="city">3D city</ToggleGroupItem>
      <ToggleGroupItem value="list">List</ToggleGroupItem>
    </ToggleGroup>
  ),
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

/** Arrow keys move between items; Space or Enter selects. */
export const ViewSwitch: Story = {}
