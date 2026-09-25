import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { DetailPanel, LayerIntro, PanelHeading, Stat } from './layer-ui'

const meta = {
  title: 'Layer/LayerIntro',
  component: LayerIntro,
  args: {
    num: '01',
    slug: 'skills',
    title: 'Skills',
    intro:
      'Every skill on my CV is a building. The taller it is, the more years I have used it in real projects.',
  },
  decorators: [(Story) => <div className="w-[380px]">{Story()}</div>],
} satisfies Meta<typeof LayerIntro>

export default meta
type Story = StoryObj<typeof meta>

/** The code-style section head from joeyoosenbrug.nl, used by every layer. */
export const Intro: Story = {}

export const WithStats: Story = {
  args: {
    num: '02',
    slug: 'career',
    title: 'Career',
    intro: undefined,
    children: (
      <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
        <Stat label="career">
          <span className="font-bold text-accent-text">6 yrs</span>
        </Stat>
        <Stat label="companies">
          <span className="font-bold text-accent-text">9</span>
        </Stat>
      </dl>
    ),
  },
}

/** The side panel that opens for a selected building. Escape closes it. */
export const Panel: StoryObj<typeof DetailPanel> = {
  render: (args) => <DetailPanel {...args} />,
  args: {
    path: 'skills/react',
    title: 'React',
    label: 'React details',
    onClose: fn(),
    children: (
      <>
        <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
          <Stat label="experience">
            <span className="text-xl font-bold text-accent-text">2.4 yrs</span>
          </Stat>
          <Stat label="district">Front-end</Stat>
        </dl>
        <PanelHeading>used at</PanelHeading>
        <ul className="grid gap-1 text-sm">
          <li>PQNavigator (RVO)</li>
          <li>Red Ocelot</li>
          <li>Vice Media</li>
        </ul>
      </>
    ),
  },
}
