<template>
  <filter-boilerplate
    ref="filter"
    v-bind="propsWithout('hide-show-more')"
    hide-show-more
    hide-exclude
    hide-sort
    hide-contextualize
    :infinite-scroll="false"
    @reset-filter-values="resetFilterValues"
  >
    <template #all>
      <span class="d-flex">
        <span class="filter__items__item__label px-1 text-truncate w-100 d-inline-block">
          {{ labelToHuman('all') }}
        </span>
      </span>
    </template>
    <template #items-group>
      <b-form-checkbox-group v-model="selected" stacked class="list-group-item p-0 border-0" @change="selectUsers">
        <b-form-checkbox
          v-for="{ user, count } in recommendedByUsersSorted"
          :key="user"
          :value="user"
          class="filter__items__item"
        >
          <span class="d-flex">
            <span class="filter__items__item__label px-1 text-truncate w-100 d-inline-block">
              <user-display :username="user" hide-avatar hide-link />
            </span>
            <span class="filter__items__item__count badge badge-pill badge-light float-right mt-1">
              {{ $n(count) }}
            </span>
          </span>
        </b-form-checkbox>
      </b-form-checkbox-group>
    </template>
  </filter-boilerplate>
</template>

<script>
import sortBy from 'lodash/sortBy'
import { mapState } from 'vuex'

import FilterBoilerplate from '@/components/filter/FilterBoilerplate'
import FilterAbstract from '@/components/filter/types/FilterAbstract'
import UserDisplay from '@/components/UserDisplay'
import utils from '@/mixins/utils'

/**
 * A Filter component to list number of documents recommended by each user.
 */
export default {
  name: 'FilterRecommendedBy',
  components: {
    FilterBoilerplate,
    UserDisplay
  },
  extends: FilterAbstract,
  mixins: [utils],
  computed: {
    ...mapState('recommended', { recommendedByUsers: 'byUsers' }),
    recommendedByUsersSorted() {
      // Sort by count (decreasing) and ensure the current user is first
      return sortBy(this.recommendedByUsers, ({ user, count }) => {
        return user === this.currentUserId ? -1e9 : -count
      })
    },
    currentUserId() {
      return this.$config ? this.$config.get('uid', 'local') : 'local'
    },
    selected: {
      get() {
        return this.getFilterValuesByName(this.filter.name)
      },
      set(values) {
        this.selectUsers(values)
      }
    }
  },
  async mounted() {
    await this.$store.dispatch('recommended/fetchIndicesRecommendations')
  },
  methods: {
    resetFilterValues(_, refresh) {
      return this.selectUsers([], refresh)
    },
    async selectUsers(users = [], refresh = true) {
      this.setFilterValue(this.filter, { key: users })
      await this.$store.dispatch('recommended/getDocumentsRecommendedBy', users)
      this.$root.$emit('filter::add-filter-values', this.filter, this.selected)
      if (refresh) {
        this.refreshRouteAndSearch()
      }
    }
  }
}
</script>
