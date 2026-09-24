import type { StorybookConfig } from '@storybook/nextjs-vite'

const config: StorybookConfig = {
  framework: '@storybook/nextjs-vite',
  stories: ['../components/**/*.stories.@(ts|tsx)', '../features/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  staticDirs: ['../public'],
}

export default config
