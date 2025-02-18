<template>
  <div class="task-batch-search-list container h-100 pt-4">
    <v-wait class="task-batch-search-list__wait" for="load haveBatchSearch">
      <fa slot="waiting" class="d-flex mx-auto mt-5" icon="circle-notch" size="2x" spin />
      <template v-if="hasBatchSearch">
        <div class="d-flex flex-wrap align-items-center">
          <batch-search-filter-query class="task-batch-search-list__search-bar my-1" />
          <batch-search-clear-filters
            class="task-batch-search-list__clear-filter-btn m-1"
            route-name="task.batch-search.list"
            :local-search-params="LOCAL_SEARCH_PARAMS"
          />
        </div>
        <batch-search-table />
      </template>
      <template v-else>
        <div class="task-batch-search-list__none text-center">
          <div class="task-batch-search-list__none__message b-table-empty-row" v-html="noBatchSearch" />
        </div>
      </template>
    </v-wait>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import utils from '@/mixins/utils'
import BatchSearchTable from '@/components/BatchSearchTable'
import BatchSearchClearFilters from '@/components/BatchSearchClearFilters'
import BatchSearchFilterQuery from '@/components/BatchSearchFilterQuery'

const LOCAL_SEARCH_PARAMS = Object.freeze({
  query: true,
  publishState: false,
  project: false,
  dateStart: true,
  dateEnd: true,
  state: true,
  order: true,
  sort: true
})

export default {
  name: 'TaskBatchSearchList',
  components: {
    BatchSearchFilterQuery,
    BatchSearchClearFilters,
    BatchSearchTable
  },
  mixins: [utils],
  data() {
    return { LOCAL_SEARCH_PARAMS }
  },
  computed: {
    ...mapGetters('batchSearch', ['hasBatchSearch']),
    howToLink() {
      return '#/docs/all-batch-search-documents'
    },
    noBatchSearch() {
      return this.$t('batchSearch.empty', { howToLink: this.howToLink })
    }
  },
  mounted() {
    if (!this.hasBatchSearch) {
      return this.getBatchSearches()
    }
  },
  methods: {
    async getBatchSearches() {
      this.$wait.start('load haveBatchSearch')
      await this.$store.dispatch('batchSearch/getBatchSearches', { init: true })
      this.$wait.end('load haveBatchSearch')
    }
  }
}
</script>

<style lang="scss" scoped>
.task-batch-search-list__none__message {
  padding: 0.75em;
  border: 1px solid #dee2e6;
  background-color: white;
}
</style>
