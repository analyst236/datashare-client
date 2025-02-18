<template>
  <div class="search-results-grid">
    <div v-if="hasResults">
      <search-results-header position="top" class="p-0 mb-3" />
      <div class="search-results-grid__items">
        <div
          v-for="document in response.hits"
          :key="document.id"
          class="search-results-grid__items__item d-flex flex-column border rounded"
        >
          <document-actions
            :document="document"
            class="search-results-grid__items__item__actions m-2"
            :is-download-allowed="isDownloadAllowed(document)"
          />
          <router-link
            class="flex-grow-1 search-results-grid__items__item__thumbnail"
            :to="{ name: 'document', params: document.routerParams, query: { q: query } }"
          >
            <document-thumbnail :document="document" size="md" />
          </router-link>
          <router-link
            v-b-tooltip
            class="search-results-grid__items__item__title py-2 px-3 small"
            :to="{ name: 'document', params: document.routerParams }"
            :title="document.slicedNameToString"
          >
            <document-sliced-name
              active-text-truncate
              show-subject
              text-truncate-rtl-attachments
              :document="document"
            />
          </router-link>
        </div>
      </div>
      <search-results-header position="bottom" class="border-top mt-3" />
    </div>
    <div v-else>
      <search-results-header position="top" bordered class="border-bottom mb-3" />
      <div class="search-results-grid__header border-0 py-5 d-flex flex-column text-center">
        <div class="search-results-grid__header__number-of-results">
          {{ $t('search.results.noResults') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import DocumentActions from '@/components/DocumentActions'
import DocumentSlicedName from '@/components/DocumentSlicedName'
import DocumentThumbnail from '@/components/DocumentThumbnail'
import SearchResultsHeader from '@/components/SearchResultsHeader'
import settings from '@/utils/settings'

/**
 * Display search results as grid.
 */
export default {
  name: 'SearchResultsGrid',
  components: {
    DocumentActions,
    DocumentSlicedName,
    DocumentThumbnail,
    SearchResultsHeader
  },
  computed: {
    ...mapState('search', ['query', 'response']),
    hasResults() {
      return this.response.hits.length > 0
    },
    hasFilters() {
      return (
        this.$store.getters['search/activeFilters'].length > 0 ||
        this.$store.state.search.field !== settings.defaultSearchField
      )
    }
  },
  methods: {
    isDownloadAllowed({ index }) {
      return !!this.$store.state.downloads.allowedFor[index]
    }
  }
}
</script>

<style lang="scss">
.search-results-grid {
  padding: 0 0 $spacer;

  &__items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    grid-auto-rows: 1fr;
    grid-gap: $spacer;

    &:before {
      content: '';
      width: 0;
      padding-bottom: 100%;
      grid-row: 1 / 1;
      grid-column: 1 / 1;
    }

    *:first-child {
      grid-row: 1 / 1;
      grid-column: 1 / 1;
    }

    &__item {
      background: white;
      position: relative;

      &:hover .document-actions {
        background: white;

        & > * {
          visibility: visible;
        }
      }

      .document-actions {
        background: transparent;
        z-index: 10;
        position: absolute;
        left: 0;
        top: 0;

        & > * {
          background: transparent;
          visibility: hidden;
        }

        &__star.starred {
          border-color: transparent;
          box-shadow: none;
          visibility: visible;

          path {
            stroke: white;
            stroke-width: 3em;
          }
        }
      }

      &__thumbnail {
        position: relative;
        overflow: hidden;

        &.router-link-active:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px solid $secondary;
          border-bottom: 0;
        }

        .document-thumbnail {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          min-width: 100%;
          min-height: 100%;
        }
      }

      &__title {
        display: flex;
        align-items: center;
      }

      &__title.router-link-active {
        background: $secondary;
        color: white;
      }

      &__title:visited:not(.router-link-active) {
        color: mix(#609, white, 50%);
      }

      &__title:hover {
        text-decoration: none;
      }
    }
  }
}
</style>
