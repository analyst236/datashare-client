import get from 'lodash/get'
import includes from 'lodash/includes'
import some from 'lodash/some'

// Private properties keys
const _VALUES = typeof Symbol === 'function' ? Symbol('_values') : '_values'
const _ROOT_STATE = typeof Symbol === 'function' ? Symbol('_ROOT_state') : '_ROOT_state'

export default class FilterText {
  constructor({
    name,
    key,
    icon = null,
    isSearchable = false,
    alternativeSearch = () => {},
    order = null,
    fromElasticSearch = true,
    preference = '_local'
  } = {}) {
    this.name = name
    this.key = key
    this.icon = icon
    this.isSearchable = isSearchable
    this.component = 'FilterText'
    this.alternativeSearch = alternativeSearch
    this.order = order
    this.fromElasticSearch = fromElasticSearch
    this.preference = preference
  }

  itemParam(item) {
    return { name: this.name, value: item.key }
  }

  itemLabel(item) {
    return item.key || item.value
  }

  addChildIncludeFilter(body, param) {
    return body.addFilter('terms', this.key, param.values)
  }

  addParentIncludeFilter(body, param) {
    return body.query('has_parent', { parent_type: 'Document' }, (q) => q.query('terms', this.key, param.values))
  }

  addParentExcludeFilter(body, param) {
    return body.query('has_parent', { parent_type: 'Document' }, (q) => q.notQuery('terms', this.key, param.values))
  }

  addChildExcludeFilter(body, param) {
    return body.notFilter('terms', this.key, param.values)
  }

  body(body, options, from = 0, size = 8) {
    return body.query('match', 'type', 'Document').agg(
      'terms',
      this.key,
      this.key,
      (sub) => {
        return sub.agg(
          'bucket_sort',
          {
            size,
            from
          },
          'bucket_truncate'
        )
      },
      options
    )
  }

  addFilter(body) {
    if (this.hasValues()) {
      if (this.reverse) {
        if (this.isNamedEntityAggregation(body)) {
          return this.addParentExcludeFilter(body, { name: this.name, values: this.values, reverse: this.reverse })
        } else {
          return this.addChildExcludeFilter(body, { name: this.name, values: this.values, reverse: this.reverse })
        }
      } else {
        if (this.isNamedEntityAggregation(body)) {
          return this.addParentIncludeFilter(body, { name: this.name, values: this.values, reverse: this.reverse })
        } else {
          return this.addChildIncludeFilter(body, { name: this.name, values: this.values, reverse: this.reverse })
        }
      }
    }
  }

  hasValues() {
    return this.values.length > 0
  }

  isNamedEntityAggregation(body) {
    return some(['"must":{"term":{"type":"NamedEntity"}}', '"must":[{"term":{"type":"NamedEntity"}}'], (str) =>
      includes(JSON.stringify(body.build()), str)
    )
  }

  applyTo(body) {
    this.addFilter(body)
  }

  bindRootState(rootState) {
    this[_ROOT_STATE] = this[_ROOT_STATE] || rootState
  }

  get rootState() {
    return this[_ROOT_STATE]
  }

  get state() {
    return this?.rootState?.search
  }

  get values() {
    return this[_VALUES] || get(this, ['state', 'values', this.name], [])
  }

  set values(values) {
    this[_VALUES] = values
  }

  get reverse() {
    return get(this, ['state', 'reversedFilters'], []).indexOf(this.name) > -1
  }

  get contextualized() {
    return get(this, ['state', 'contextualizedFilters'], []).indexOf(this.name) > -1
  }

  get sortBy() {
    return get(this, ['state', 'sortedFilters', this.name, 'sortBy'], '_count')
  }

  get sortByOrder() {
    return get(this, ['state', 'sortedFilters', this.name, 'sortByOrder'], 'desc')
  }
}
