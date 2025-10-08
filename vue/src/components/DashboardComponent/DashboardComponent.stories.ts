import { type Meta, type StoryObj } from '@storybook/vue3-vite'

import DashboardComponent from './DashboardComponent.vue'
import DashboardGroupComponent from './DashboardGroupComponent.vue'
import DashboardPanelComponent from './DashboardPanelComponent.vue'

const meta: Meta<typeof DashboardComponent> = {
  title: 'Components/Dashboard',
  component: DashboardComponent,
  args: {
    boxedPanels: true,
    orientation: 'vertical',
  },
  argTypes: {
    boxedPanels: {
      control: 'boolean',
      description: 'Whether panels should have a boxed appearance with background and padding',
    },
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'The orientation of the dashboard layout',
    },
  },
  parameters: {
    layout: 'fullscreen',
  },
}
export default meta

type Story = StoryObj<typeof DashboardComponent>

export const Base: Story = {
  render: (args) => ({
    components: {
      DashboardComponent,
      DashboardGroup: DashboardGroupComponent,
      DashboardPanel: DashboardPanelComponent,
    },
    setup() {
      return { args }
    },
    template: `
      <div style="background-color: hsl(222, 100%, 90%); padding: 2rem; width: 100%; height: 600px;">
        <DashboardComponent v-bind="args">
          <DashboardPanel hug-content stay-visible-when-other-expand>
            <b>Header</b>
          </DashboardPanel>

          <DashboardGroup>
            <DashboardPanel hug-content stay-visible-when-other-expand>
              <b>Menu</b>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
                <li>Item 3</li>
              </ul>
            </DashboardPanel>

            <DashboardGroup>
              <DashboardPanel can-expand>
                <div class="notification is-success is-light">
                  <p>Welcome to the Dashboard component</p>
                  <p>It helps organize components on a page with easy panel management.</p>
                </div>
              </DashboardPanel>

              <DashboardPanel can-expand>
                <p>Content panel with expandable functionality</p>
              </DashboardPanel>
            </DashboardGroup>
          </DashboardGroup>
        </DashboardComponent>
      </div>
    `,
  }),
}

export const Basics: Story = {
  render: (args) => ({
    components: {
      DashboardComponent,
      DashboardGroup: DashboardGroupComponent,
      DashboardPanel: DashboardPanelComponent,
    },
    setup() {
      return { args }
    },
    template: `
      <div style="background-color: hsl(222, 100%, 90%); padding: 2rem; height: 400px;">
        <DashboardComponent v-bind="args">
          <DashboardGroup>
            <DashboardPanel>A1</DashboardPanel>
            <DashboardPanel>A2</DashboardPanel>
            <DashboardPanel>A3</DashboardPanel>
          </DashboardGroup>

          <DashboardGroup>
            <DashboardPanel>B1</DashboardPanel>
            <DashboardPanel>B2</DashboardPanel>
          </DashboardGroup>

          <DashboardGroup>
            <DashboardPanel>C1</DashboardPanel>
            <DashboardPanel>C2</DashboardPanel>
            <DashboardPanel>C3</DashboardPanel>
          </DashboardGroup>
        </DashboardComponent>
      </div>
    `,
  }),
}

export const Orientation: Story = {
  render: (args) => ({
    components: {
      DashboardComponent,
      DashboardGroup: DashboardGroupComponent,
      DashboardPanel: DashboardPanelComponent,
    },
    setup() {
      return { args }
    },
    template: `
      <div style="background-color: hsl(222, 100%, 90%); padding: 2rem; height: 500px;">
        <DashboardComponent v-bind="args">
          <DashboardGroup>
            <DashboardPanel>A</DashboardPanel>
            <DashboardGroup>
              <DashboardPanel>B</DashboardPanel>
              <DashboardGroup>
                <DashboardPanel>C</DashboardPanel>
                <DashboardGroup>
                  <DashboardPanel>D</DashboardPanel>
                  <DashboardGroup>
                    <DashboardPanel>E</DashboardPanel>
                  </DashboardGroup>
                </DashboardGroup>
              </DashboardGroup>
            </DashboardGroup>
          </DashboardGroup>
        </DashboardComponent>
      </div>
    `,
  }),
}

export const Expanding: Story = {
  render: (args) => ({
    components: {
      DashboardComponent,
      DashboardGroup: DashboardGroupComponent,
      DashboardPanel: DashboardPanelComponent,
    },
    setup() {
      return { args }
    },
    template: `
      <div style="background-color: hsl(222, 100%, 90%); padding: 2rem; height: 500px;">
        <DashboardComponent v-bind="args">
          <DashboardGroup>
            <DashboardPanel>Regular Panel</DashboardPanel>
            <DashboardPanel can-expand>
              <div class="notification is-success is-light">
                <p>This panel can expand - try clicking the expand button!</p>
              </div>
            </DashboardPanel>
            <DashboardPanel>Another Panel</DashboardPanel>
          </DashboardGroup>

          <DashboardGroup>
            <DashboardPanel>Panel 1</DashboardPanel>
            <DashboardPanel can-expand>
              <div class="notification is-info is-light">
                <p>Multiple panels can be expandable</p>
              </div>
            </DashboardPanel>
          </DashboardGroup>

          <DashboardGroup hug-content>
            <DashboardPanel stay-visible-when-other-expand>
              <p><b>Always Visible:</b> This panel stays visible when others expand</p>
            </DashboardPanel>
          </DashboardGroup>
        </DashboardComponent>
      </div>
    `,
  }),
}

export const Sizing: Story = {
  render: (args) => ({
    components: {
      DashboardComponent,
      DashboardGroup: DashboardGroupComponent,
      DashboardPanel: DashboardPanelComponent,
    },
    setup() {
      return { args }
    },
    template: `
      <div style="background-color: hsl(222, 100%, 90%); padding: 2rem; height: 600px;">
        <DashboardComponent v-bind="args">
          <DashboardGroup>
            <DashboardPanel>Default (weight=1)</DashboardPanel>
            <DashboardPanel :weight="3" style="border: 2px solid red;">
              <p><b>Weight=3:</b> Takes 3x more space</p>
            </DashboardPanel>
          </DashboardGroup>

          <DashboardGroup orientation="horizontal">
            <DashboardPanel hug-content style="border: 2px solid blue;">
              <div style="width: 150px;">
                <p><b>hug-content</b></p>
                <p>Fixed width content</p>
              </div>
            </DashboardPanel>
            <DashboardPanel>
              <p>Remaining space</p>
            </DashboardPanel>
          </DashboardGroup>

          <DashboardGroup>
            <DashboardPanel max-height="20%" hug-content>
              <p><b>max-height="20%"</b></p>
              <div class="notification">Limited to 20% of parent height</div>
            </DashboardPanel>
            <DashboardPanel>
              <p>Takes remaining vertical space</p>
            </DashboardPanel>
          </DashboardGroup>
        </DashboardComponent>
      </div>
    `,
  }),
}
