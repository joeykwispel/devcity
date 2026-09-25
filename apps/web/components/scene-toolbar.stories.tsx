import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SceneToolbar } from './scene-toolbar'

const meta = {
  title: 'Layer/SceneToolbar',
  component: SceneToolbar,
} satisfies Meta<typeof SceneToolbar>

export default meta
type Story = StoryObj<typeof meta>

/** 3D/list switch and share link, shown under the intro card of every layer. */
export const Toolbar: Story = {}
