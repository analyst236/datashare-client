<template>
  <b-form @submit.prevent="saveSearch">
    <div class="w-100 border-top">
      <div class="card-body pb-1">
        <b-form-group label-size="sm" :label="`${$t('userHistory.name')} *`">
          <b-form-input v-model="name" type="text" required />
        </b-form-group>
        <p v-html="$t('userHistorySaveSearchForm.description', { searchHistoryPath })"></p>
      </div>
      <div class="card-footer">
        <div class="d-flex justify-content-end align-items-center">
          <b-btn type="submit" variant="primary">
            {{ $t('global.submit') }}
          </b-btn>
        </div>
      </div>
    </div>
  </b-form>
</template>

<script>
/**
 * A form to save the search in user history
 */
export default {
  name: 'UserHistorySaveSearchForm',
  props: {
    /**
     * The indices of the current item.
     */
    indices: {
      type: [String, Array]
    }
  },
  data() {
    return {
      name: ''
    }
  },
  computed: {
    uriFromStore() {
      const from = 0
      const query = { ...this.$store.getters['search/toRouteQuery'](), from }
      const {
        route: { fullPath }
      } = this.$router.resolve({ name: 'search', query })
      return fullPath
    },
    searchHistoryPath() {
      const {
        route: { path }
      } = this.$router.resolve({ name: 'user-history.saved-search.list' })
      return `/#${path}`
    }
  },
  methods: {
    async saveSearch() {
      try {
        await this.$core.api.addUserHistoryEvent(this.indices, 'SEARCH', this.name, this.uriFromStore)
        const { href } = this.$router.resolve({ name: 'user-history.saved-search.list' })
        const toastParams = { href, noCloseButton: true, variant: 'success' }
        this.$root.$bvToast.toast(this.$t('userHistory.submitSuccess'), toastParams)
      } catch (_) {
        const toastParams = { noCloseButton: true, variant: 'danger' }
        this.$root.$bvToast.toast(this.$t('userHistory.submitError'), toastParams)
      } finally {
        this.$emit('submit')
      }
    }
  }
}
</script>
