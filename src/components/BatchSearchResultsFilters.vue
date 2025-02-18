<template>
  <div class="batch-search-results-filters">
    <div class="card batch-search-results-filters__queries overflow-hidden border-0">
      <h6 class="card-header d-flex align-items-center">
        <span class="flex-grow-1 my-auto">
          {{ $t('batchSearchResultsFilters.queries.heading') }}
        </span>
        <span v-if="hasMultipleQueries" class="mr-2">
          {{ $t('search.results.sort.sort') }}
        </span>
        <b-dropdown
          v-if="hasMultipleQueries"
          class="batch-search-results-filters__queries__sort"
          toggle-class="p-0"
          right
          :text="$t(`search.results.sort.${sortField}`)"
          variant="link"
        >
          <b-dropdown-item v-for="key in sortFields" :key="key" :active="key === sortField" @click="sort(key)">
            {{ $t(`search.results.sort.${key}`) }}
          </b-dropdown-item>
        </b-dropdown>
      </h6>
      <div class="batch-search-results-filters__queries__search text-dark">
        <search-form-control
          v-model="queriesFilter"
          :placeholder="$t('batchSearchResultsFilters.filterQueries')"
        ></search-form-control>
      </div>
      <div class="small">
        <template v-if="filteredQueries.length">
          <selectable-dropdown
            v-model="filterQueries"
            class="batch-search-results-filters__queries__dropdown border-0 m-0 p-0"
            deactivate-keys
            multiple
            scroller-height="280px"
            :height="35"
            :eq="(item, other) => item.label === other.label"
            :items="filteredQueries"
          >
            <template #item-label="{ item }">
              <div class="d-flex batch-search-results-filters__queries__dropdown__item">
                <span class="flex-grow-1 text-truncate batch-search-results-filters__queries__dropdown__item__label">
                  {{ item.label }}
                </span>
                <span class="batch-search-results-filters__queries__dropdown__item__count">
                  <b-badge class="px-2" variant="tertiary" pill>
                    {{ $n(item.count) }}
                  </b-badge>
                </span>
                <span
                  class="batch-search-results-filters__queries__dropdown__item__search"
                  @click.stop.prevent="executeSearch(item.label)"
                >
                  <fa icon="search" class="text-tertiary"></fa>
                </span>
              </div>
            </template>
          </selectable-dropdown>
        </template>
        <div v-else class="text-center text-dark">Loading queries ...</div>
        <filter-footer
          class="batch-search-results-filters__footer p-2"
          :filter="{ name: 'queries', key: 'queries' }"
          hide-sort
          hide-contextualize
          hide-show-more
          @toggle-filter="excludeSelectedQueries"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { compact, isEqual, map, orderBy } from 'lodash'
import Fuse from 'fuse.js'

import SearchFormControl from '@/components/SearchFormControl'
import FilterFooter from '@/components/filter/FilterFooter'

/**
 * Form to filter a batch search results by query
 */
export default {
  name: 'BatchSearchResultsFilters',
  components: {
    SearchFormControl,
    FilterFooter
  },
  model: {
    prop: 'selectedQueries',
    event: 'update:selected-queries'
  },
  props: {
    /**
     * The batch search query keys
     */
    queryKeys: {
      type: Array,
      default: () => []
    },
    /**
     * The batch search indices
     */
    indices: {
      type: [String, Array]
    },
    selectedQueries: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      queriesFilter: null,
      sortFields: ['default', 'count'],
      filterQueries: map(this.selectedQueries, (label) => ({ label }))
    }
  },
  computed: {
    fuse() {
      const keys = ['label']
      const options = { shouldSort: false, keys }
      return new Fuse(this.queries, options)
    },
    queries() {
      if (this.sortField === 'count') {
        return orderBy(this.queryKeys, ['count'], ['desc'])
      } else {
        return this.queryKeys
      }
    },
    queriesExcluded() {
      return this.$route?.query?.queriesExcluded === 'true' || this.$route?.query?.queriesExcluded === true
    },
    filteredQueries() {
      return this.queriesFilter ? this.fuse.search(this.queriesFilter).map((result) => result.item) : this.queries
    },
    hasMultipleQueries() {
      return this.queries && this.queries.length > 1
    },
    routeQuery() {
      return this.$route?.query ?? {}
    },
    sortField: {
      get() {
        return this.$route?.query?.queries_sort === 'default' ? 'default' : 'count'
      },
      set(sortField) {
        return this.$router.push({ query: { queries_sort: sortField } })
      }
    }
  },
  watch: {
    filterQueries: {
      handler(values) {
        this.$emit('update:selected-queries', map(values, 'label'))
      }
    }
  },
  methods: {
    updateRoute() {
      const queries = compact(map(this.selectedQueries, 'label'))
      if (!isEqual(this.routeQuery.queries || [], queries)) {
        const query = { ...this.routeQuery, queries }
        return this.$router.push({ name: 'task.batch-search.view.results', query }).catch(() => {})
      }
    },
    executeSearch(q) {
      this.$store.commit('search/reset')
      this.$router
        .push({ name: 'search', query: { queries: this.selectedQueries, q, indices: this.indices.join(',') } })
        .catch(() => {})
    },
    excludeSelectedQueries() {
      const query = { ...this.routeQuery, queriesExcluded: !this.queriesExcluded }
      this.$router.push({ name: 'task.batch-search.view.results', query }).catch(() => {})
    },
    sort(queriesSort) {
      const query = { ...this.routeQuery, queries_sort: queriesSort }
      this.$router.push({ name: 'task.batch-search.view.results', query }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.batch-search-results-filters {
  max-width: 90vw;
  width: 300px;

  &__queries {
    &__search {
      background-color: $card-cap-bg;
      padding: $card-spacer-y $card-spacer-x;
    }

    &__sort {
      z-index: 1001;

      &:deep(.btn.dropdown-toggle) {
        color: white;
        text-decoration: none;
      }
    }

    &__dropdown {
      border-radius: 0;
      max-height: 280px;
      overflow: auto;

      &__item {
        &__search:not([aria-describedby]) {
          display: none;
        }

        &:hover .batch-search-results-filters__queries__dropdown__item__search {
          color: inherit;
          cursor: pointer;
          display: block;
        }

        &:hover .batch-search-results-filters__queries__dropdown__item__count {
          display: none;
        }
      }
    }
  }
  &__footer {
    background-color: #000;
  }
}
</style>
