<template>
  <div class="batch-search-status">
    <ellipse-status :status="batchSearch.state" :no-badge="noLabel" horizontal>
      <template v-if="isFailed" #error>
        <div v-if="batchSearch.errorQuery" class="batch-search-status__modal__error-query mb-2 font-weight-bolder">
          <span v-html="$t('batchSearch.errorQuery', { query: batchSearch.errorQuery })"></span>
        </div>
        <div v-if="batchSearch.errorMessage">
          <template v-if="errorMessageAsJson">
            <json-formatter
              class="batch-search-status__modal__error-message"
              :json="errorMessageAsJson"
              :open="4"
              :config="{ theme: 'dark' }"
            />
          </template>
          <template v-else>
            <pre
              class="batch-search-status__modal__error-message mt-3 mb-0"
            ><code>{{ batchSearch.errorMessage }}</code></pre>
          </template>
          <div class="mt-2" v-html="$t('batchSearch.errorMessage')"></div>
        </div>
      </template>
    </ellipse-status>
  </div>
</template>

<script>
import { capitalize } from 'lodash'

import { toVariant } from '@/utils/utils'
import EllipseStatus from '@/components/EllipseStatus'
import JsonFormatter from '@/components/JsonFormatter'

/**
 * A badge to display batch search status.
 */
export default {
  name: 'BatchSearchStatus',
  components: {
    EllipseStatus,
    JsonFormatter
  },
  filters: {
    capitalize,
    toVariant
  },
  props: {
    /**
     * The batch search meta data
     */
    batchSearch: {
      type: Object
    },
    /**
     * Hide the label
     */
    noLabel: {
      type: Boolean
    }
  },
  computed: {
    statusName() {
      return this.batchSearch.state.toLowerCase()
    },
    isFailed() {
      return this.statusName === 'failure' || this.statusName === 'error'
    },
    errorMessageAsJson() {
      const re = /{"error":.+}/gm
      const message = this.batchSearch.errorMessage || ''
      const match = message.match(re)
      try {
        return JSON.parse(match)
      } catch (_) {
        return null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.batch-search-status {
  &__badge {
    cursor: pointer;
  }

  &__modal {
    &__error-query {
      font-size: $font-size-lg;

      &:deep(code) {
        background-color: $light;
        border: 1px gray solid;
        border-radius: 3px;
        margin-right: 0.2rem;
        padding: 0 2px;
      }
    }

    &__error-message {
      background-color: black;
      color: white;
      padding: $spacer;
      overflow: auto;

      code {
        white-space: normal;
        display: block;
      }
    }
  }
}
</style>
