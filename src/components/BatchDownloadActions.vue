<script>
import { uniqueId } from 'lodash'

export default {
  name: 'BatchDownloadActions',
  props: {
    /**
     * Name of the batch download's task
     */
    name: {
      type: String
    },
    /**
     * State of the batch download's task
     */
    state: {
      type: String,
      default: ''
    },
    /**
     * Attributes of the batch download
     */
    value: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    isTaskRunning() {
      return this.state.toUpperCase() === 'RUNNING'
    },
    popoverTarget() {
      return `#${this.togglerId}`
    },
    projects() {
      return this?.value?.projects?.map((p) => p.name) || []
    },
    uri() {
      return this?.value?.uri || null
    },
    togglerId() {
      return uniqueId('batch-download-actions-')
    }
  },
  methods: {
    closePopover() {
      this.$root.$emit('bv::hide::popover', this.togglerId)
    },
    async deleteTask() {
      try {
        this.closePopover()
        await this.$core.api.deleteTask(this.name)
        this.notifyDeleteSucceed()
      } catch (error) {
        this.notifyDeleteFailed(error)
      }
    },
    async relaunchTask() {
      try {
        this.closePopover()
        const projectIds = this.projects
        const query = this.parseQuery()
        const uri = this.uri
        await this.$core.api.runBatchDownload({ projectIds, query, uri })
        this.notifyRelaunchSucceed()
      } catch (error) {
        this.notifyRelaunchFailed(error)
      }
    },
    notifyRelaunchSucceed() {
      const title = this.$t('batchDownload.relaunch.succeed')
      const variant = 'success'
      const body = this.$t('batchDownload.relaunch.succeedBody')
      this.$root.$bvToast.toast(body, { variant, title })
      /**
       * The batch download was relaunched successfully
       *
       * @event relaunched
       */
      this.$emit('relaunched', this.value)
    },
    notifyRelaunchFailed(error) {
      const title = this.$t('batchDownload.relaunch.failed')
      const variant = 'danger'
      const body = this.$t('batchDownload.relaunch.failedBody')
      this.$root.$bvToast.toast(body, { variant, title })
      /**
       * The batch download couldn't be relaunched
       *
       * @event relaunchFailed
       */
      this.$emit('relaunchFailed', error)
    },
    notifyDeleteSucceed() {
      /**
       * The batch download was deleted successfully
       *
       * @event deleted
       */
      this.$emit('deleted', this.value)
    },
    notifyDeleteFailed(error) {
      const title = this.$t('batchDownload.delete.failed')
      const variant = 'danger'
      const body = this.$t('batchDownload.delete.failedBody')
      this.$root.$bvToast.toast(body, { variant, title })
      /**
       * The batch download couldn't be deleted
       *
       * @event deleteFailed
       */
      this.$emit('deleteFailed', error)
    },
    parseQuery() {
      return JSON.parse(this.value.query || null) ?? {}
    },
    tryToParseQuery() {
      try {
        return this.parseQuery()
      } catch (_) {
        return {}
      }
    }
  }
}
</script>

<template>
  <div class="batch-download-actions">
    <b-btn :id="togglerId" variant="link" size="sm" class="p-1">
      <fa icon="ellipsis" fixed-width class="mx-1" />
    </b-btn>
    <b-popover
      boundary="viewport"
      custom-class="popover-body-p-0 popover-body-overflow-hidden dropdown-menu shadow popover-white"
      placement="left"
      triggers="focus"
      :target="popoverTarget"
    >
      <b-dropdown-item-button class="batch-download-actions__relaunch" @click="relaunchTask()">
        <fa icon="redo" fixed-width class="mr-1" />
        {{ $t('batchDownloadActions.relaunch') }}
      </b-dropdown-item-button>
      <b-dropdown-item v-if="uri" :to="uri" class="batch-download-actions__search">
        <fa icon="search" fixed-width class="mr-1" />
        {{ $t('batchDownloadActions.search') }}
      </b-dropdown-item>
      <b-dropdown-item-button v-else disabled class="batch-download-actions__search">
        <fa icon="search" fixed-width class="mr-1" />
        {{ $t('batchDownloadActions.search') }}
      </b-dropdown-item-button>
      <b-dropdown-divider />
      <b-dropdown-item-button v-if="isTaskRunning" disabled button-class="batch-download-actions__delete">
        <fa icon="trash-alt" fixed-width class="mr-1" />
        {{ $t('batchDownloadActions.delete') }}
      </b-dropdown-item-button>
      <b-dropdown-item-button v-else button-class="batch-download-actions__delete text-danger" @click="deleteTask">
        <fa icon="trash-alt" fixed-width class="mr-1" />
        {{ $t('batchDownloadActions.delete') }}
      </b-dropdown-item-button>
    </b-popover>
  </div>
</template>
