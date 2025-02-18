<template>
  <form
    :id="uniqueId"
    class="search-bar container-fluid"
    :class="{ 'search-bar--focused': focused, 'search-bar--animated': animated }"
    @submit.prevent="submit"
  >
    <div class="d-flex align-items-center">
      <search-bar-input
        v-model="query"
        class="search-bar__input"
        :placeholder="placeholder"
        :size="size"
        @blur="onBlur"
        @input="onInput"
        @focus="onFocus"
      >
        <template #addons>
          <search-bar-input-dropdown-for-field v-if="!hideFieldDropdown" v-model="field" />
          <search-bar-input-dropdown-for-projects
            v-model="selectedProjects"
            :disabled="!!indices"
            :no-caret="!!indices"
          />
        </template>
        <template #suggestions>
          <selectable-dropdown
            ref="suggestions"
            class="search-bar__suggestions dropdown-menu"
            :hide="!suggestions.length"
            :items="suggestions"
            @input="selectTerm"
            @click.native="submit"
          >
            <template #item-label="{ item }">
              <div class="d-flex">
                <div class="flex-grow-1 text-truncate">
                  <template v-if="item.current">
                    <span v-html="item.key" />
                  </template>
                  <span v-else v-html="injectTermInQuery(item.key, null, true)"></span>
                </div>
              </div>
            </template>
          </selectable-dropdown>
        </template>
      </search-bar-input>
      <div v-if="settings" class="px-0">
        <shortkeys-modal class="d-none d-md-inline"></shortkeys-modal>
        <b-btn
          v-b-tooltip.hover.bottomleft
          :title="$t('userHistory.saveSearch')"
          class="text-dark"
          size="md"
          variant="transparent"
          @click="$refs['user-history-save-search-form'].show()"
        >
          <fa icon="save" />
          <b-modal
            ref="user-history-save-search-form"
            body-class="p-0"
            hide-footer
            size="md"
            :title="$t('userHistory.saveSearch')"
          >
            <user-history-save-search-form
              :indices="formIndices"
              :uri="uri"
              @submit="$refs['user-history-save-search-form'].hide()"
            />
          </b-modal>
        </b-btn>
      </div>
    </div>
  </form>
</template>

<script>
import { castArray, concat, escapeRegExp, each, get, iteratee, last, orderBy, some, throttle, uniqueId } from 'lodash'
import bodybuilder from 'bodybuilder'
import lucene from 'lucene'

import ShortkeysModal from '@/components/ShortkeysModal'
import SearchBarInput from '@/components/SearchBarInput'
import SearchBarInputDropdownForField from '@/components/SearchBarInputDropdownForField'
import SearchBarInputDropdownForProjects from '@/components/SearchBarInputDropdownForProjects'
import UserHistorySaveSearchForm from '@/components/UserHistorySaveSearchForm'
import settings from '@/utils/settings'

function escapeLuceneChars(str) {
  const escapable = [' ', '+', '-', '&&', '||', '!', '(', ')', '{', '}', '[', ']', '^', '~', '?', ':', '\\', '/']
  return some(escapable, (char) => str.indexOf(char) > -1) ? JSON.stringify(str) : str
}

/**
 * The general search form.
 */
export default {
  name: 'SearchBar',
  components: {
    SearchBarInput,
    ShortkeysModal,
    UserHistorySaveSearchForm,
    SearchBarInputDropdownForField,
    SearchBarInputDropdownForProjects
  },
  props: {
    /**
     * Animate the focus on the search input.
     */
    animated: {
      type: Boolean
    },
    /**
     * Placeholder in the search bar.
     */
    placeholder: {
      type: String,
      default: function () {
        this.$t('search.placeholder')
      }
    },
    /**
     * Display the shortcuts button.
     */
    settings: {
      type: Boolean
    },
    /**
     * Hide the field dropdown
     */
    hideFieldDropdown: {
      type: Boolean
    },
    /**
     * Search input size
     * @values sm, md, lg
     */
    size: {
      type: String,
      default: 'md'
    },
    /**
     * Force the search bar to search intogiven indices
     */
    indices: {
      type: Array,
      default: null
    }
  },
  data() {
    return {
      field: this.$store.state.search.field,
      focused: false,
      query: this.$store.state.search.query,
      suggestions: [],
      currentQuery: { key: '', current: true }
    }
  },
  computed: {
    selectedProjects: {
      get() {
        return (this.indices ?? this.$store.state.search.indices).map((name) => ({ name }))
      },
      set(projects) {
        const indices = projects.map(iteratee('name'))
        this.$store.commit('search/indices', indices)
      }
    },
    formIndices() {
      return this.selectedProjects.map(iteratee('name'))
    },
    uniqueId() {
      return uniqueId('search-bar-')
    },
    suggestionsAllowed() {
      const terms = this.termCandidates().map((t) => t.term)
      const lastTerm = last(terms) || ''
      return ['all', settings.suggestedImplicitFields].indexOf(this.field) > -1 && lastTerm.length > 4
    },
    uri() {
      return window.location.hash.substr(2)
    }
  },
  mounted() {
    this.$store.subscribe((mutation) => {
      if (mutation.type === 'search/query') {
        this.$set(this, 'query', mutation.payload)
      }
      if (mutation.type === 'search/reset') {
        this.$set(this, 'field', this.$store.state.search.field)
      }
    })
  },
  methods: {
    submit() {
      this.hideSuggestions()
      // Change the route after update the store with the new query
      this.$store.commit('search/indices', this.formIndices)
      this.$store.commit('search/field', this.field)
      this.$store.commit('search/query', this.query)
      this.$store.commit('search/from', 0)
      const query = this.$store.getters['search/toRouteQueryWithStamp']()
      this.$router.push({ name: 'search', query })
    },
    async suggestTerms(candidates) {
      const query = this.query
      const index = this.formIndices.join(',')
      const candidate = last(candidates)
      const fields = castArray(candidate.field === '<implicit>' ? settings.suggestedImplicitFields : candidate.field)
      const include = `.*${escapeRegExp(candidate.term).toLowerCase()}.*`
      const body = bodybuilder().size(0)
      each(fields, (field) => {
        body.aggregation('terms', field, { include }, field)
      })
      const preference = 'search-bar-suggestions'
      const response = await this.$core.api.elasticsearch.search({ index, body: body.build(), preference })

      let suggestions = []
      each(fields, (field) => {
        suggestions = concat(suggestions, get(response, `aggregations.${field}.buckets`, []))
      })
      suggestions = orderBy(suggestions, ['doc_count'], ['desc'])
      // Return an object to check later if the promise result is still applicable
      return { query, suggestions }
    },
    termCandidates(ast = null) {
      try {
        // List of terms to return
        let terms = []
        // Parse the query by default
        ast = ast === null ? lucene.parse(this.query) : ast
        // Use recursive call for branches
        if (ast.left) terms = terms.concat(this.termCandidates(ast.left))
        if (ast.right) terms = terms.concat(this.termCandidates(ast.right))
        // Only <implicit> and tag fields are can be read
        if (settings.suggestedFields.indexOf(ast.field) > -1) terms.push(ast)
        // Return all the terms
        return terms
      } catch (_) {
        return []
      }
    },
    replaceLastTermCandidate(term, ast = null, highlight = true) {
      // Parse the query by default
      ast = ast === null ? lucene.parse(this.query) : ast
      // Use recursive call for branches
      if (ast.right) this.replaceLastTermCandidate(term, ast.right, highlight)
      else if (ast.left) this.replaceLastTermCandidate(term, ast.left, highlight)
      // Only <implicit> and tag fields are can be read
      else if (settings.suggestedFields.indexOf(ast.field) > -1 && ast.term === last(this.termCandidates()).term) {
        ast.term = ast.quoted ? term : escapeLuceneChars(term)
        ast.term = highlight ? `<strong>${ast.term}</strong>` : ast.term
      }
      return ast
    },
    injectTermInQuery(term, ast = null, highlight = true) {
      try {
        ast = this.replaceLastTermCandidate(term, ast, highlight)
        return lucene.toString(ast)
      } catch (_) {
        return this.query
      }
    },
    selectTerm(term) {
      if (term) {
        this.query = term.current ? term.key : this.injectTermInQuery(term.key, null, false)
      }
    },
    searchTerms: throttle(async function () {
      try {
        if (this.suggestionsAllowed) {
          this.currentQuery = { key: this.query, current: true }
          const { suggestions, query } = await this.suggestTerms(this.termCandidates())
          // Avoid setting suggestions if user lost the focus on the input
          if (this.focused) {
            // Is the query still valid
            const suggestionList = suggestions.length ? [this.currentQuery, ...suggestions] : suggestions
            this.$set(this, 'suggestions', query === this.query ? suggestionList : [])
            this.$refs.suggestions.activeItems = []
          }
        } else {
          this.$set(this, 'suggestions', [])
        }
      } catch (_) {
        this.hideSuggestions()
      }
    }, 200),
    hideSuggestions() {
      this.$set(this, 'suggestions', [])
    },
    hideSuggestionsAfterDelay() {
      setTimeout(() => {
        this.$nextTick(this.hideSuggestions)
      }, 200)
    },
    onBlur() {
      this.focused = false
      this.hideSuggestionsAfterDelay()
    },
    onInput() {
      this.searchTerms()
    },
    onFocus() {
      this.focused = true
      this.searchTerms()
    }
  }
}
</script>

<style lang="scss" scoped>
.search-bar {
  &::v-deep(.search-bar-input__input) {
    height: auto;
  }

  &--focused.search-bar--animated {
    :deep(.input-group) {
      filter: drop-shadow(0 0.3em 0.6em rgba(black, 0.2));
      transition: transform 0.2s;
      transform: translateY(-0.25em);
    }
  }

  & &__suggestions.dropdown-menu {
    left: 0;
    position: absolute !important;
    right: 0;
    top: 100%;
  }

  &__suggestions {
    box-shadow: $dropdown-box-shadow;
    margin-top: $dropdown-spacer;

    & .dropdown-item {
      cursor: pointer;

      &:active,
      &:focus,
      &.active {
        color: white;
      }
    }
  }
}
</style>
