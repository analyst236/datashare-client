<template>
  <div class="search" :class="{ 'search--show-document': showDocument, [`search--${layout}`]: true }">
    <hook name="search:before" />
    <div class="d-flex">
      <button
        v-if="!showFilters"
        v-b-tooltip.right
        class="search__show-filters align-self-center ml-3 btn btn-link px-0"
        :title="$t('search.showFilters')"
        @click="clickOnShowFilters()"
      >
        <fa icon="arrow-right" />
        <span class="sr-only">{{ $t('search.showFilters') }}</span>
        <b-badge v-if="activeFilters" pill variant="warning" class="search__show-filters__counter">
          {{ activeFilters }}
        </b-badge>
      </button>
      <app-nav class="flex-grow-1" />
    </div>
    <div class="px-0 search__body">
      <hook name="search.body:before" />
      <component :is="bodyWrapper" ref="searchBodyScrollbar" class="search__body__search-results search__body__results">
        <div v-if="!!error" class="py-5 text-center">
          {{ errorMessage }}
          <div v-if="isRequestTimeoutError" class="mt-2">
            <b-button @click="refresh">
              <fa icon="redo" class="mr-1"></fa>
              {{ $t('search.errors.tryAgain') }}
            </b-button>
          </div>
        </div>
        <search-results v-else-if="isReady" :layout="layout" />
        <content-placeholder v-for="n in 3" v-else :key="n" class="bg-white p-3 mb-3" />
      </component>
      <div v-if="showDocument" class="search__body__document">
        <search-document-navbar class="search__body__document__navbar" :is-shrinked="isShrinked" />
        <div class="search__body__document__wrapper">
          <div id="search__body__document__wrapper" class="overflow-auto text-break" @scroll="handleScroll">
            <router-view class="search__body__document__wrapper__view" />
          </div>
        </div>
      </div>
      <router-link
        v-show="showDocument"
        class="search__body__backdrop"
        :to="{ name: 'search', query: toRouteQuery }"
      ></router-link>
      <hook name="search.body:after" />
    </div>
    <hook name="search:after" />
  </div>
</template>

<script>
import compact from 'lodash/compact'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import VuePerfectScrollbar from 'vue-perfect-scrollbar'
import { errors as esErrors } from 'elasticsearch-browser'
import { mapState } from 'vuex'

import AppNav from '@/components/AppNav'
import Hook from '@/components/Hook'
import SearchDocumentNavbar from '@/components/SearchDocumentNavbar'
import SearchResults from '@/components/SearchResults'

export default {
  name: 'Search',
  components: {
    AppNav,
    Hook,
    SearchDocumentNavbar,
    SearchResults
  },
  async beforeRouteUpdate(to, from, next) {
    if (to.name === 'search' && this.isDifferentFromQuery(to.query)) {
      try {
        this.$store.dispatch('search/updateFromRouteQuery', to.query)
        await this.search()
        next()
      } catch (_) {
        this.wrongQuery()
      }
    } else {
      next()
    }
  },
  data() {
    return {
      errorMessages: {
        BadRequest: 'search.errors.badRequest',
        InternalServerError: 'search.errors.internalError',
        NoConnections: 'search.errors.noConnections',
        NotFound: 'search.errors.notFound',
        RequestTimeout: 'search.errors.requestTimeout',
        ServiceUnavailable: 'search.errors.serviceUnavailable'
      },
      isShrinked: false,
      intervalId: -1
    }
  },
  computed: {
    ...mapState('search', ['isReady', 'showFilters', 'error', 'layout']),
    ...mapState('document', { currentDocument: 'doc' }),
    toRouteQuery() {
      return this.$store.getters['search/toRouteQuery']()
    },
    showDocument() {
      return ['document'].indexOf(this.$route.name) > -1
    },
    errorMessage() {
      const defaultMessage = this.$t('search.errors.somethingWrong')
      for (const type in this.errorMessages) {
        // The error is an instance of the key and it exist as a translation key
        if (this.error instanceof esErrors[type] && this.$te(this.errorMessages[type])) {
          return this.$t(this.errorMessages[type])
        }
      }
      return get(this.error, 'body.error.root_cause.0.reason', defaultMessage)
    },
    isRequestTimeoutError() {
      return this.error instanceof esErrors.RequestTimeout
    },
    showFilters: {
      get() {
        return this.$store.state.search.showFilters
      },
      set() {
        this.$store.commit('search/toggleFilters')
      }
    },
    activeFilters() {
      return this.$store.getters['search/activeFilters'].length
    },
    bodyWrapper() {
      return this.layout === 'list' ? VuePerfectScrollbar : 'div'
    }
  },
  watch: {
    showDocument(show) {
      if (show) {
        this.isShrinked = false
      }
    },
    isReady(isReady) {
      if (isReady) {
        this.$Progress.finish()
        clearInterval(this.intervalId)
        this.$set(this, 'intervalId', -1)
      } else {
        this.$Progress.set(0)
        const intervalId = setInterval(() => this.$Progress.increase(2), 1000)
        this.$set(this, 'intervalId', intervalId)
      }
      this.updateScrollBars()
    },
    $route() {
      this.updateScrollBars()
    },
    currentDocument() {
      this.updateScrollBars()
    }
  },
  async created() {
    try {
      this.$store.dispatch('search/updateFromRouteQuery', this.$route.query)
      await this.search()
    } catch (_) {
      this.wrongQuery()
    }
  },
  mounted() {
    this.$root.$on('index::delete::all', this.search)
    this.$root.$on('filter::starred::refresh', this.refresh)
    this.$root.$on('document::content::changed', this.updateScrollBars)
  },
  methods: {
    handleScroll(e) {
      this.$set(this, 'isShrinked', e.target.scrollTop > 40)
    },
    search(queryOrParams = null) {
      try {
        return this.$store.dispatch('search/query', queryOrParams)
      } catch (_) {
        this.wrongQuery()
      }
    },
    refresh() {
      try {
        return this.$store.dispatch('search/refresh', false)
      } catch (_) {
        this.wrongQuery()
      }
    },
    wrongQuery() {
      this.$Progress.finish()
    },
    clickOnShowFilters() {
      this.showFilters = !this.showFilters
    },
    isDifferentFromQuery(query) {
      return !isEqual(query, this.$store.getters['search/toRouteQuery']())
    },
    updateScrollBars() {
      compact([this.$refs.searchBodyScrollbar]).forEach((ref) => ref?.ps?.update())
    }
  }
}
</script>

<style lang="scss">
.search {
  @include clearfix();
  display: flex;
  flex-direction: column;
  max-height: 100vh;

  &__show-filters.btn {
    background: $app-context-sidebar-bg;
    border-radius: 20px;
    color: white;
    display: block;
    height: 40px;
    line-height: 40px;
    min-width: 1px;
    padding: 0;
    position: relative;
    text-align: center;
    width: 40px;

    &:hover {
      background: lighten($app-context-sidebar-bg, 10%);
      color: white;
    }
  }

  .btn &__show-filters__counter.badge {
    position: absolute;
  }

  &--list.search .search__body__results {
    background: white;
    right: auto;
    width: 100%;
    max-width: calc(#{$search-results-list-width} - #{$spacer * 2});
    border-radius: $card-border-radius;
    box-shadow: 0 2px 10px 0 rgba(black, 0.05), 0 2px 30px 0 rgba(black, 0.02);
    overflow: hidden;
  }

  &__body {
    height: calc(100vh - var(--app-nav-height));
    overflow: hidden;
    position: relative;

    & &__document,
    & &__results {
      bottom: $spacer;
      position: absolute;
      top: 0;
      z-index: 10;
    }

    & &__results {
      left: $spacer;
      overflow: auto;
      right: $spacer;
    }

    & &__document {
      background: white;
      border-radius: 0;
      bottom: 0;
      box-shadow: $modal-content-box-shadow-sm-up;
      display: flex;
      flex-direction: column;
      flex: 1 0 auto;
      margin: 0;
      padding: 0;
      position: fixed;
      top: 0;
      right: 0;
      z-index: 20;
      width: $document-max-width;
      max-width: calc(100vw - #{$app-sidebar-reduced-width});

      &__wrapper {
        position: relative;
        flex-grow: 1;

        & > * {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }

        &__view {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          width: 100%;

          .document {
            flex-grow: 1;
            min-height: 100%;
          }
        }
      }
    }

    &__backdrop {
      cursor: pointer;
      z-index: 15;
      position: fixed;
      top: 0;
      bottom: 0;
      right: 0;
      width: 100%;
      background: rgba($modal-backdrop-bg, $modal-backdrop-opacity);
      display: block;

      @media (max-width: $document-float-breakpoint-width) {
        display: block;
      }
    }
  }
}
</style>
