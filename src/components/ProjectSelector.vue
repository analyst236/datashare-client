<template>
  <b-form-group class="mb-0">
    <b-form-checkbox-group v-if="multiple" v-model="selectedProject" :disabled="disabled" :options="projectOptions" />
    <b-form-select v-else v-model="selectedProject" :disabled="disabled" :options="projectOptions" :size="size" />
  </b-form-group>
</template>

<script>
import { castArray, isEqual, startCase } from 'lodash'

/**
 * A single-project selector input.
 */
export default {
  name: 'ProjectSelector',
  props: {
    /**
     * The selected project value.
     * @model
     */
    value: {
      type: [String, Array],
      required: true
    },
    /**
     * Select size
     * @values sm, md, lg
     */
    size: {
      type: String,
      default: 'md'
    },
    /**
     * Allow to select several projects
     */
    multiple: {
      type: Boolean
    },
    /**
     * Disable the input
     */
    disabled: {
      type: Boolean
    }
  },
  computed: {
    projects() {
      return this.$core.projects
    },
    projectOptions() {
      return this.projects.map((project) => {
        const text = project.label || startCase(project.name)
        const value = project.name
        const disabled = this.multiple && isEqual(this.selectedProject, [value])
        return { disabled, text, value }
      })
    },
    selectedProject: {
      get() {
        return this.multiple ? castArray(this.value) : this.value
      },
      set(value) {
        this.$emit('input', value)
      }
    }
  }
}
</script>
