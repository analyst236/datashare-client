import Vue from 'vue'
import includes from 'lodash/includes'

const levels = {
  '0': 'File on disk',
  '1': '1st level',
  '2': '2nd level',
  '3': '3rd level',
  '4': '4th level',
  '5': '5th level',
  '6': '6th level',
  '7': '7th level',
  '8': '8th level',
  '9': '9th level',
  '10': '10th level'
}

class FacetText {
  constructor (name, key, isSearchable, labelFun) {
    this.name = name
    this.key = key
    this.isSearchable = isSearchable
    this.itemLabel = labelFun
    this.reverse = false
    this.values = []
    this.component = 'FacetText'
  }

  itemParam (item) {
    return { name: this.name, value: item.key }
  }

  addChildIncludeFilter (body, param) {
    return body.addFilter('terms', this.key, param.values)
  }

  addParentIncludeFilter (body, param) {
    return body.query('has_parent', { 'parent_type': 'Document' }, q => q.query('terms', this.key, param.values))
  }

  addParentExcludeFilter (body, param) {
    return body.query('has_parent', { 'parent_type': 'Document' }, q => q.notQuery('terms', this.key, param.values))
  }

  addChildExcludeFilter (body, param) {
    return body.notFilter('terms', this.key, param.values)
  }

  body (body, options) {
    return body.agg('terms', this.key, this.key, options)
  }

  addFilter (body) {
    if (this.hasValues()) {
      if (this.reverse) {
        if (this.isNamedEntityAggregation(body)) {
          return this.addParentExcludeFilter(body, {name: this.name, values: this.values, reverse: this.reverse})
        } else {
          return this.addChildExcludeFilter(body, {name: this.name, values: this.values, reverse: this.reverse})
        }
      } else {
        if (this.isNamedEntityAggregation(body)) {
          return this.addParentIncludeFilter(body, {name: this.name, values: this.values, reverse: this.reverse})
        } else {
          return this.addChildIncludeFilter(body, {name: this.name, values: this.values, reverse: this.reverse})
        }
      }
    }
  }

  hasValues () {
    return this.values.length > 0
  }

  isNamedEntityAggregation (body) {
    return includes(JSON.stringify(body.build()), '"must":{"term":{"type":"NamedEntity"}}')
  }

  applyTo (body) {
    this.addFilter(body)
  }
}

class FacetType extends FacetText {
  constructor (name, key, isSearchable, labelFun) {
    super(name, key, isSearchable, labelFun)
    this.component = 'FacetType'
  }

  addChildIncludeFilter (body, param, func) {
    return this.queryBuilder(body, param, 'orQuery')
  }

  addChildExcludeFilter (body, param, func) {
    return this.queryBuilder(body, param, 'notQuery')
  }
}

class FacetDocument extends FacetType {
  constructor (name, key, isSearchable, labelFun) {
    super(name, key, isSearchable, labelFun)
    this.component = 'FacetDocument'
  }

  addParentIncludeFilter (body, param) {
    return body.query('has_parent', { 'parent_type': 'Document' }, q => this.addChildIncludeFilter(q, param))
  }
}

class FacetDate extends FacetDocument {
  constructor (name, key, isSearchable, labelFun) {
    super(name, key, isSearchable, labelFun)
    this.component = 'FacetDate'
  }

  queryBuilder (body, param, func) {
    return body.query('bool', sub => {
      param.values.forEach(date => {
        let gte = new Date(parseInt(date))
        let tmp = new Date(parseInt(date))
        let lte = new Date(tmp.setMonth(tmp.getMonth() + 1) - 1)
        sub[func]('range', this.key, { gte, lte })
      })
      return sub
    })
  }

  body (body) {
    return body.agg('date_histogram', this.key, {
      interval: '1M',
      format: 'yyyy-MM'
    }, this.key)
  }
}

class FacetPath extends FacetDocument {
  constructor (name, key, isSearchable) {
    super(name, key, isSearchable, null)
    this.prefix = true
    this.component = 'FacetPath'
  }

  queryBuilder (body, param, func) {
    return body.query('bool', sub => {
      param.values.forEach(dirname => sub[func]('prefix', { dirname }))
      return sub
    })
  }

  body (body, options) {
    return body.agg('terms', 'dirname.tree', this.key, {
      size: 500,
      order: { '_key': 'asc' },
      exclude: Vue.prototype.config.dataDir + '/.*/.*',
      include: Vue.prototype.config.dataDir + '/.*',
      ...options
    })
  }
}

class FacetNamedEntity extends FacetType {
  constructor (name, key, isSearchable, category = 'PERSON') {
    super(name, key, isSearchable, null)
    this.category = category
    this.component = 'FacetNamedEntity'
  }

  queryBuilder (body, param, func) {
    return body[func]('bool', b => {
      b.orQuery('has_child', 'type', 'NamedEntity', { }, sub => {
        return sub.query('query_string', {
          default_field: 'mentionNorm',
          query: param.values.map(v => `(${v})`).join(' OR ')
        })
      })

      b.orQuery('query_string', {
        default_field: 'mentionNorm',
        query: param.values.map(v => `(${v})`).join(' OR ')
      })
      return b
    })
  }

  body (body, options) {
    return body
      .query('term', 'type', 'NamedEntity')
      .filter('term', 'isHidden', 'false')
      .filter('term', 'category', this.category)
      .agg('terms', 'mentionNorm', this.key, {
        size: 50,
        order: [ {'byDocs': 'desc'}, {'_count': 'desc'} ],
        ...options
      }, sub => {
        return sub
          .agg('cardinality', 'join#Document', 'byDocs')
          .agg('terms', 'category', 'byCategories', sub => {
            return sub.agg('cardinality', 'join#Document', 'byDocs')
          })
      })
  }
}

export {FacetDate, FacetPath, FacetText, FacetNamedEntity, levels}
