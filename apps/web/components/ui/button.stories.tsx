import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from './button'

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Build city' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'primary', 'ghost'] },
    size: { control: 'inline-radio', options: ['default', 'sm', 'icon'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Primary: Story = { args: { variant: 'primary' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Small: Story = { args: { size: 'sm', children: 'Copy link' } }
export const Disabled: Story = { args: { disabled: true } }

/** asChild renders the styles on another element, e.g. an external link. */
export const AsLink: Story = {
  args: {
    asChild: true,
    children: (
      <a href="https://github.com/joeykwispel/devcity" target="_blank" rel="noreferrer">
        Open on GitHub
      </a>
    ),
  },
}
