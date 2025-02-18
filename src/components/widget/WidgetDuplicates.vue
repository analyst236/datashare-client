<template>
  <div class="widget widget--duplicates">
    <div v-if="widget.title" class="widget__header" :class="{ 'card-header': widget.card }">
      <h4 class="m-0" v-html="widget.title"></h4>
    </div>
    <div class="p-4">
      <v-wait for="duplicate-counters" transition="fade">
        <fa slot="waiting" icon="circle-notch" spin size="2x" class="m-auto d-block"></fa>
        <div>
          <template v-if="anyData">
            <stacked-bar-chart
              :data="data"
              :x-axis-tick-format="humanNumber"
              label-above
              :bar-colors="colors"
              :keys="keys"
              :groups="groups"
            ></stacked-bar-chart>
            <p class="small text-muted mb-0">
              {{ $t('widget.duplicates.duplicated') }}
            </p>
          </template>
          <template v-else>
            <p class="text-muted text-center m-0">
              {{ $t('widget.noData') }}
            </p>
          </template>
        </div>
      </v-wait>
    </div>
  </div>
</template>

<script>
import { get, sum } from 'lodash'
import { waitFor } from 'vue-wait'

import humanNumber from '@/filters/humanNumber'

/**
 * A widget for the insights page indicating the proportion of duplicates in the data.
 */
export default {
  name: 'WidgetDuplicate',
  props: {
    /**
     * The widget definition object.
     */
    widget: {
      type: Object
    }
  },
  data() {
    return {
      data: [],
      colors: ['#193D87', '#6081c4'],
      keys: ['duplicates', 'documents'],
      groups: ['Duplicates*', 'Documents']
    }
  },
  computed: {
    anyData() {
      return sum(Object.values(this.data[0] ?? {})) > 0
    }
  },
  async created() {
    await this.loadData()
  },
  mounted() {
    this.$store.subscribe(async ({ type }) => {
      // The project changed
      if (type === 'insights/project') {
        await this.loadData()
      }
    })
  },
  methods: {
    async count(query) {
      const index = this.$store.state.insights.project
      const body = { track_total_hits: true, query: { query_string: { query } } }
      const res = await this.$core.api.elasticsearch.search({ index, body, size: 0 })
      return get(res, 'hits.total.value', 0)
    },
    countTotal() {
      const q = 'type:Document'
      return this.count(q)
    },
    countDuplicates() {
      const q = 'type:Duplicate'
      return this.count(q)
    },
    loadData: waitFor('duplicate-counters', async function () {
      const documents = await this.countTotal()
      const duplicates = await this.countDuplicates()
      this.$set(this, 'data', [{ documents, duplicates }])
    }),
    humanNumber
  }
}
</script>

<style lang="scss" scoped>
.widget--duplicates {
  width: 100%;

  &:deep(.stacked-bar-chart__groups__item__label) {
    display: none;
  }
}
</style>
