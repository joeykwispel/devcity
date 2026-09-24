import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CityList } from './city-list'

const meta = {
  title: 'Layer/CityList',
  component: CityList,
  args: {
    interactive: true,
    groups: [
      {
        id: 'frontend',
        label: 'Front-end',
        color: 'hsl(168, 60%, 68%)',
        items: [
          { id: 'TypeScript', name: 'TypeScript', value: '2.8 yrs', magnitude: 34 },
          { id: 'React', name: 'React', value: '2.4 yrs', magnitude: 29 },
          { id: 'Angular', name: 'Angular', value: '1.1 yrs', magnitude: 13 },
          { id: 'Nuxt', name: 'Nuxt', value: 'listed', magnitude: 0 },
        ],
      },
      {
        id: 'testing',
        label: 'Testing',
        color: 'hsl(32, 60%, 68%)',
        items: [
          { id: 'Vitest', name: 'Vitest', value: '2.8 yrs', magnitude: 34 },
          { id: 'Playwright', name: 'Playwright', value: '1.1 yrs', magnitude: 13 },
        ],
      },
    ],
  },
  decorators: [(Story) => <div className="glass panel w-[560px] p-5">{Story()}</div>],
} satisfies Meta<typeof CityList>

export default meta
type Story = StoryObj<typeof meta>

/** The list view: every building as a keyboard-accessible button. */
export const List: Story = {}

/** Large repositories: capped per group, with a filter. */
export const Filterable: Story = { args: { filterable: true, limit: 2 } }
