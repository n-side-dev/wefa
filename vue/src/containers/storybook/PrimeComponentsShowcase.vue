<template>
  <div class="min-h-[980px] bg-surface-50 p-6 text-surface-900">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Toolbar class="rounded-2xl border border-surface-200 bg-surface-0 px-4 py-3 shadow-sm">
        <template #start>
          <div class="flex items-center gap-3">
            <Avatar label="WF" shape="circle" class="bg-primary-500 text-surface-0" />
            <div>
              <div class="text-sm font-semibold">Prime Components Lab</div>
              <div class="text-xs text-surface-500">Operations demo workspace</div>
            </div>
            <Badge value="Live" severity="success" />
          </div>
        </template>
        <template #end>
          <div class="flex items-center gap-2">
            <Button label="Sync" icon="pi pi-refresh" outlined />
            <SplitButton label="New" icon="pi pi-plus" :model="splitButtonItems" />
            <div class="flex items-center gap-2 text-xs text-surface-500">
              <span>Live mode</span>
              <ToggleSwitch v-model="liveMode" />
            </div>
          </div>
        </template>
      </Toolbar>

      <div class="flex flex-wrap items-center justify-between gap-4">
        <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems" class="max-w-full" />
        <Steps :model="steps" :active-step="1" class="min-w-[280px]" />
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <Card class="border border-surface-200 shadow-sm">
          <template #title>Active Orders</template>
          <template #subtitle>Last 24 hours</template>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-3xl font-semibold">42</div>
                <div class="text-xs text-surface-500">12% above baseline</div>
              </div>
              <Knob v-model="orderCompletion" :size="80" :stroke-width="8" :min="0" :max="100" />
            </div>
            <Divider class="my-4" />
            <div class="flex items-center justify-between text-xs text-surface-600">
              <span>Completion</span>
              <span>{{ orderCompletion }}%</span>
            </div>
            <ProgressBar :value="orderCompletion" />
          </template>
        </Card>

        <Card class="border border-surface-200 shadow-sm">
          <template #title>Team Coverage</template>
          <template #subtitle>Shift rotation</template>
          <template #content>
            <div class="flex items-center gap-3">
              <AvatarGroup>
                <Avatar label="AM" />
                <Avatar label="KS" />
                <Avatar label="JL" />
                <Avatar label="TR" />
              </AvatarGroup>
              <Badge value="8" severity="info" />
            </div>
            <Divider class="my-4" />
            <div class="flex items-center justify-between">
              <div class="flex flex-wrap gap-2">
                <Chip label="On-call" icon="pi pi-bell" />
                <Chip label="Remote" icon="pi pi-home" />
              </div>
              <Tag value="Balanced" severity="success" />
            </div>
            <div class="mt-4 flex items-center gap-2">
              <ProgressSpinner class="h-8 w-8" stroke-width="6" />
              <span class="text-xs text-surface-500">Syncing roster</span>
            </div>
          </template>
        </Card>

        <Card class="border border-surface-200 shadow-sm">
          <template #title>Inventory Alerts</template>
          <template #subtitle>Critical materials</template>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <div class="text-3xl font-semibold text-amber-600">7</div>
                <div class="text-xs text-surface-500">Items below threshold</div>
              </div>
              <Tag value="Priority" severity="warning" />
            </div>
            <Divider class="my-4" />
            <div class="flex flex-col gap-2 text-xs text-surface-600">
              <div class="flex items-center justify-between">
                <span>Cooling Modules</span>
                <Badge value="2" severity="danger" />
              </div>
              <div class="flex items-center justify-between">
                <span>Packaging</span>
                <Badge value="5" severity="warning" />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="flex flex-col gap-6 lg:col-span-2">
          <Panel header="Work Orders" class="border border-surface-200 shadow-sm">
            <DataTable :value="workOrders" paginator :rows="5" striped-rows class="text-sm">
              <Column field="id" header="ID" />
              <Column field="title" header="Title" />
              <Column field="owner" header="Owner" />
              <Column field="status" header="Status">
                <template #body="{ data }">
                  <Tag :value="data.status" :severity="statusSeverity(data.status)" />
                </template>
              </Column>
              <Column field="progress" header="Progress">
                <template #body="{ data }">
                  <div class="flex items-center gap-2">
                    <ProgressBar :value="data.progress" class="w-28" />
                    <span class="text-xs text-surface-500">{{ data.progress }}%</span>
                  </div>
                </template>
              </Column>
            </DataTable>
          </Panel>

          <Panel header="New Work Order" class="border border-surface-200 shadow-sm">
            <Tabs v-model:value="activeTab">
              <TabList>
                <Tab :value="0">Details</Tab>
                <Tab :value="1">Review</Tab>
              </TabList>
              <TabPanels>
                <TabPanel :value="0">
                  <div class="grid gap-4 md:grid-cols-2">
                    <div class="flex flex-col gap-2">
                      <label class="text-xs font-semibold text-surface-600" for="title"
                        >Title</label
                      >
                      <InputText id="title" v-model="form.title" placeholder="Calibration sweep" />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label class="text-xs font-semibold text-surface-600" for="code"
                        >Work code</label
                      >
                      <InputMask id="code" v-model="form.code" mask="AA-999" placeholder="WF-301" />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label class="text-xs font-semibold text-surface-600">Priority</label>
                      <Select
                        v-model="form.priority"
                        :options="priorityOptions"
                        option-label="label"
                        placeholder="Select"
                      />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label class="text-xs font-semibold text-surface-600">Assignee</label>
                      <AutoComplete
                        v-model="form.assignee"
                        :suggestions="filteredAssignees"
                        placeholder="Search team"
                        @complete="onAssigneeComplete"
                      />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label class="text-xs font-semibold text-surface-600">Due date</label>
                      <Calendar v-model="form.dueDate" show-icon date-format="M dd, yy" />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label class="text-xs font-semibold text-surface-600">Budget</label>
                      <InputNumber
                        v-model="form.budget"
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                      />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label class="text-xs font-semibold text-surface-600">Teams</label>
                      <MultiSelect
                        v-model="form.teams"
                        :options="teamOptions"
                        option-label="label"
                        placeholder="Assign teams"
                      />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label class="text-xs font-semibold text-surface-600">Stage</label>
                      <SelectButton v-model="form.stage" :options="stageOptions" />
                    </div>
                  </div>

                  <Divider class="my-4" />

                  <div class="grid gap-4 lg:grid-cols-3">
                    <div class="flex flex-col gap-2">
                      <label class="text-xs font-semibold text-surface-600">Confidence</label>
                      <Slider v-model="form.confidence" class="mt-2" />
                      <span class="text-xs text-surface-500">{{ form.confidence }}%</span>
                    </div>
                    <div class="flex flex-col gap-2">
                      <label class="text-xs font-semibold text-surface-600">Quality rating</label>
                      <Rating v-model="form.rating" :cancel="false" />
                    </div>
                    <div class="flex flex-col gap-2">
                      <label class="text-xs font-semibold text-surface-600">Highlight color</label>
                      <ColorPicker v-model="form.color" format="hex" />
                    </div>
                    <div class="flex items-center gap-2">
                      <Checkbox v-model="form.notify" :binary="true" input-id="notify" />
                      <label class="text-xs text-surface-600" for="notify"
                        >Notify stakeholders</label
                      >
                    </div>
                    <div class="flex items-center gap-2">
                      <RadioButton v-model="form.urgency" input-id="urgent" value="urgent" />
                      <label class="text-xs text-surface-600" for="urgent">Urgent</label>
                      <RadioButton v-model="form.urgency" input-id="standard" value="standard" />
                      <label class="text-xs text-surface-600" for="standard">Standard</label>
                    </div>
                    <div class="flex items-center gap-2">
                      <ToggleSwitch v-model="form.requiresAudit" />
                      <span class="text-xs text-surface-600">Audit required</span>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel :value="1">
                  <div class="flex flex-col gap-4">
                    <Message severity="info"
                      >Ready to submit when validations are complete.</Message
                    >
                    <InlineMessage severity="success"
                      >All required fields are filled.</InlineMessage
                    >
                    <Accordion :value="['0']" multiple>
                      <AccordionPanel value="0">
                        <AccordionHeader>Checklist</AccordionHeader>
                        <AccordionContent>
                          <div class="flex flex-col gap-2 text-sm">
                            <div class="flex items-center gap-2">
                              <Checkbox
                                v-model="form.checklist"
                                value="brief"
                                input-id="check-brief"
                              />
                              <label for="check-brief">Brief attached</label>
                            </div>
                            <div class="flex items-center gap-2">
                              <Checkbox
                                v-model="form.checklist"
                                value="resources"
                                input-id="check-resources"
                              />
                              <label for="check-resources">Resources confirmed</label>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionPanel>
                      <AccordionPanel value="1">
                        <AccordionHeader>Risk Summary</AccordionHeader>
                        <AccordionContent>
                          <div class="text-sm text-surface-600">
                            Low exposure. Equipment redundancy verified and vendor response within 4
                            hours.
                          </div>
                        </AccordionContent>
                      </AccordionPanel>
                    </Accordion>
                  </div>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Panel>
        </div>

        <div class="flex flex-col gap-6">
          <Panel header="Navigation" class="border border-surface-200 shadow-sm">
            <PanelMenu :model="panelMenuItems" class="w-full" />
          </Panel>

          <Panel header="Focus Queue" class="border border-surface-200 shadow-sm">
            <Listbox
              v-model="selectedQueue"
              :options="queueOptions"
              option-label="label"
              class="w-full"
            />
            <Divider class="my-4" />
            <Timeline :value="timelineEvents" class="text-xs">
              <template #opposite="slotProps">
                <span class="text-surface-500">{{ slotProps.item.time }}</span>
              </template>
              <template #content="slotProps">
                <div class="flex flex-col gap-1">
                  <span class="font-semibold text-surface-700">{{ slotProps.item.title }}</span>
                  <span class="text-surface-500">{{ slotProps.item.owner }}</span>
                </div>
              </template>
            </Timeline>
          </Panel>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <Panel header="Controls" class="border border-surface-200 shadow-sm">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-surface-600">Status</label>
              <SelectButton v-model="controls.status" :options="statusOptions" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-surface-600">Access</label>
              <Password v-model="controls.accessKey" toggle-mask placeholder="Enter access key" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-surface-600">Regions</label>
              <MultiSelect
                v-model="controls.regions"
                :options="regionOptions"
                option-label="label"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-surface-600">Tags</label>
              <Chips v-model="controls.tags" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-surface-600">Throughput</label>
              <InputNumber v-model="controls.throughput" suffix="%" />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold text-surface-600">Quick toggle</label>
              <ToggleSwitch v-model="controls.quickToggle" />
            </div>
          </div>
        </Panel>

        <Panel header="Notes & Files" class="border border-surface-200 shadow-sm">
          <div class="flex flex-col gap-4">
            <Textarea v-model="notes" rows="4" placeholder="Add operational notes" />
            <FileUpload mode="basic" name="files[]" choose-label="Attach" />
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Tag value="Draft" severity="info" />
                <Badge value="3" severity="contrast" />
              </div>
              <Button label="Submit" icon="pi pi-send" />
            </div>
          </div>
        </Panel>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Accordion from 'primevue/accordion'
import AccordionContent from 'primevue/accordioncontent'
import AccordionHeader from 'primevue/accordionheader'
import AccordionPanel from 'primevue/accordionpanel'
import AutoComplete from 'primevue/autocomplete'
import Avatar from 'primevue/avatar'
import AvatarGroup from 'primevue/avatargroup'
import Badge from 'primevue/badge'
import Breadcrumb from 'primevue/breadcrumb'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Chip from 'primevue/chip'
import Chips from 'primevue/chips'
import ColorPicker from 'primevue/colorpicker'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Divider from 'primevue/divider'
import FileUpload from 'primevue/fileupload'
import InlineMessage from 'primevue/inlinemessage'
import InputMask from 'primevue/inputmask'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Knob from 'primevue/knob'
import Listbox from 'primevue/listbox'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'
import Panel from 'primevue/panel'
import PanelMenu from 'primevue/panelmenu'
import Password from 'primevue/password'
import ProgressBar from 'primevue/progressbar'
import ProgressSpinner from 'primevue/progressspinner'
import RadioButton from 'primevue/radiobutton'
import Rating from 'primevue/rating'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Slider from 'primevue/slider'
import SplitButton from 'primevue/splitbutton'
import Steps from 'primevue/steps'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Timeline from 'primevue/timeline'
import ToggleSwitch from 'primevue/toggleswitch'
import Toolbar from 'primevue/toolbar'

const breadcrumbHome = { icon: 'pi pi-home', label: 'Home' }
const breadcrumbItems = [
  { label: 'Operations', icon: 'pi pi-briefcase' },
  { label: 'Prime Showcase' },
]

const steps = [{ label: 'Brief' }, { label: 'Design' }, { label: 'Build' }, { label: 'Launch' }]

const splitButtonItems = [
  { label: 'Duplicate', icon: 'pi pi-clone' },
  { label: 'Export', icon: 'pi pi-download' },
  { label: 'Archive', icon: 'pi pi-folder' },
]

const panelMenuItems = [
  {
    label: 'Dashboards',
    icon: 'pi pi-chart-line',
    items: [
      { label: 'Operations', icon: 'pi pi-cog' },
      { label: 'Inventory', icon: 'pi pi-box' },
      { label: 'Compliance', icon: 'pi pi-shield' },
    ],
  },
  {
    label: 'Reports',
    icon: 'pi pi-file',
    items: [
      { label: 'Daily Snapshot', icon: 'pi pi-calendar' },
      { label: 'Quarterly Review', icon: 'pi pi-chart-bar' },
    ],
  },
]

const statusOptions = ['Active', 'Hold', 'Closed']

const priorityOptions = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Normal', value: 'normal' },
  { label: 'Low', value: 'low' },
]

const teamOptions = [
  { label: 'Calibration', value: 'calibration' },
  { label: 'QA', value: 'qa' },
  { label: 'Reliability', value: 'reliability' },
]

const regionOptions = [
  { label: 'North America', value: 'na' },
  { label: 'EMEA', value: 'emea' },
  { label: 'APAC', value: 'apac' },
]

const stageOptions = ['Draft', 'Ready', 'Approved']

const assignees = ['Alex Morgan', 'Kai Santos', 'Jo Lee', 'Tariq Reed', 'Rina Park', 'Devon Hall']
const filteredAssignees = ref<string[]>([])

const workOrders = ref([
  {
    id: 'WO-1042',
    title: 'Sensor calibration sweep',
    owner: 'Alex M.',
    status: 'In Review',
    progress: 62,
  },
  {
    id: 'WO-1047',
    title: 'Packaging quality audit',
    owner: 'Jo L.',
    status: 'Queued',
    progress: 28,
  },
  {
    id: 'WO-1051',
    title: 'Line 4 throughput test',
    owner: 'Rina P.',
    status: 'In Progress',
    progress: 74,
  },
  {
    id: 'WO-1059',
    title: 'Cooling module retrofit',
    owner: 'Kai S.',
    status: 'Blocked',
    progress: 15,
  },
  {
    id: 'WO-1063',
    title: 'Safety signage refresh',
    owner: 'Devon H.',
    status: 'Complete',
    progress: 100,
  },
  {
    id: 'WO-1068',
    title: 'Dock scheduling update',
    owner: 'Tariq R.',
    status: 'In Review',
    progress: 46,
  },
])

const queueOptions = [
  { label: 'Line 4 Repairs' },
  { label: 'Cold Storage Audit' },
  { label: 'Vendor Onboarding' },
  { label: 'Safety Training' },
]

const timelineEvents = [
  { time: '08:30', title: 'Morning handoff', owner: 'Operations' },
  { time: '10:15', title: 'Supplier check-in', owner: 'Procurement' },
  { time: '13:00', title: 'QA walkthrough', owner: 'Quality' },
  { time: '16:45', title: 'Shift recap', owner: 'Ops Lead' },
]

const orderCompletion = ref(68)
const liveMode = ref(true)
const activeTab = ref(0)
const selectedQueue = ref(queueOptions[0])

const form = ref({
  title: 'Calibration sweep',
  code: 'WF-301',
  priority: priorityOptions[1],
  assignee: 'Alex Morgan',
  dueDate: new Date(2026, 1, 28),
  budget: 12500,
  teams: [teamOptions[0], teamOptions[1]],
  stage: 'Ready',
  confidence: 72,
  rating: 4,
  color: '2563eb',
  notify: true,
  urgency: 'standard',
  requiresAudit: false,
  checklist: ['brief', 'resources'],
})

const controls = ref({
  status: 'Active',
  accessKey: '',
  regions: [regionOptions[0], regionOptions[2]],
  tags: ['priority', 'dock-7'],
  throughput: 82,
  quickToggle: true,
})

const notes = ref('Dock 7 retrofit scheduled for next week. Coordinate vendor access badges.')

const onAssigneeComplete = (event: { query: string }) => {
  const query = event.query.toLowerCase()
  filteredAssignees.value = assignees.filter((assignee) => assignee.toLowerCase().includes(query))
}

const statusSeverity = (status: string) => {
  switch (status) {
    case 'Complete':
      return 'success'
    case 'In Progress':
      return 'info'
    case 'Queued':
      return 'secondary'
    case 'Blocked':
      return 'danger'
    case 'In Review':
      return 'warning'
    default:
      return 'contrast'
  }
}
</script>
