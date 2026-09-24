import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Input } from './input'

const meta = {
  title: 'UI/Input',
  component: Input,
  args: { placeholder: 'owner/repo or GitHub URL', 'aria-label': 'GitHub repository' },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
export const Filled: Story = { args: { defaultValue: 'joeykwispel/devcity' } }
export const Invalid: Story = { args: { defaultValue: 'not a repo', 'aria-invalid': true } }
