<script>
import { get } from 'lodash'

import FindNamedEntitiesForm from '@/components/FindNamedEntitiesForm'

/**
 * This page displays a form to create a new project.
 */
export default {
  name: 'ProjectViewFindNamedEntities',
  components: {
    FindNamedEntitiesForm
  },
  computed: {
    projectRoute() {
      return { name: 'project.document-extract' }
    },
    projectName() {
      return this.$route.params?.name
    }
  },
  methods: {
    async submit({ error }) {
      if (error) {
        this.notifyCreationFailed(error)
      } else {
        this.notifyCreationSucceed()
      }
    },
    notifyCreationSucceed() {
      const title = this.$t('projectViewFindNamedEntities.notify.succeed')
      const variant = 'success'
      const message = this.$t('projectViewFindNamedEntities.notify.succeedBody')
      const linkText = this.$t('projectViewFindNamedEntities.notify.seeTasks')
      const body = this.$createElement('div', {}, [
        this.$createElement('p', {}, message),
        this.$createElement('router-link', { props: { to: { name: 'task.analysis.list' } } }, linkText)
      ])
      this.$root.$bvToast.toast(body, { variant, title })
    },
    notifyCreationFailed(error) {
      const title = this.$t('projectViewFindNamedEntities.notify.failed')
      const variant = 'danger'
      const body = get(error, 'response.data.error') ?? this.$t('projectViewFindNamedEntities.notify.failedBody')
      this.$root.$bvToast.toast(body, { variant, title })
    }
  }
}
</script>

<template>
  <div class="project-new">
    <div class="container p-4">
      <div class="card">
        <h4 class="card-header">Find named entities (people, locations, organisations)</h4>
        <find-named-entities-form
          id="find-named-entities-form p-4"
          class="card-body"
          :project-name="projectName"
          hide-project-selector
          @submit="submit"
        >
          <template #footer="{ disabled }">
            <div class="col text-right">
              <b-btn variant="primary" class="ml-2" type="submit" :disabled="disabled">
                {{ $t('indexing.go') }}
              </b-btn>
            </div>
          </template>
        </find-named-entities-form>
      </div>
    </div>
  </div>
</template>
