import { each, find, isEqual, replace } from 'lodash'
import bodybuilder from 'bodybuilder'
import es from 'elasticsearch-browser'

import { EventBus } from '@/utils/event-bus'
import settings from '@/utils/settings'

// Custom API for datashare
// @see https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/16.x/extending_core_components.html
export function datasharePlugin(Client) {
  Client.prototype.getDocument = function (index, id, routing = null, params = {}) {
    try {
      return this.get({ index, id, routing, ...params })
    } catch (error) {
      EventBus.$emit('http::error', error)
      throw error
    }
  }

  Client.prototype.getDocumentWithoutContent = async function (index, id, routing = null) {
    const sourceExclude = 'content,content_translated'
    return this.getDocument(index, id, routing, { _source_excludes: sourceExclude })
  }

  Client.prototype.getDocumentWithContent = async function (index, id, routing = null) {
    const source = 'content,content_translated'
    return this.getDocument(index, id, routing, { _source: source })
  }

  Client.prototype._search = function (params) {
    return this.search({ ...params }).then(
      (data) => data,
      (error) => {
        EventBus.$emit('http::error', error)
        throw error
      }
    )
  }

  Client.prototype.getDocumentNamedEntities = async function (index, docId, routing = null, from = 0, size = 200) {
    const body = bodybuilder()
      .size(size)
      .from(from)
      .query('parent_id', {
        type: 'NamedEntity',
        id: docId
      })
      .filter('term', 'isHidden', 'false')
      .build()
    return this._search({ index, routing, body })
  }

  Client.prototype.getDocumentNamedEntitiesInCategory = async function (
    index,
    docId,
    routing = null,
    from = 0,
    size = 200,
    category = null,
    filterToken = null
  ) {
    const body = bodybuilder()
      .size(size)
      .from(from)
      .query('parent_id', {
        type: 'NamedEntity',
        id: docId
      })
      .addQuery('bool', (bool) => {
        if (filterToken) {
          const fields = ['mentionNorm', 'mention']
          const query = `*${filterToken}*`
          bool.orQuery('query_string', { fields, query })
        }
        return bool
      })
      .filter('term', 'isHidden', 'false')
      .filter('term', 'category', category)
      .build()
    return this._search({ index, routing, body })
  }

  Client.prototype.addQueryToFilter = function (query, body, fields = []) {
    body.query('match_all').addQuery('bool', (b) =>
      b
        // Add the query string to the body
        .orQuery('query_string', {
          query,
          fields: fields.length ? fields : undefined
        })
    )
  }

  Client.prototype.searchFilter = function (
    index,
    filter,
    query = '*',
    filters = [],
    isGlobalSearch = false,
    options = {},
    fields = [],
    from = 0,
    size = 8
  ) {
    const { preference } = filter
    // Avoid searching for nothing
    query = ['', null, undefined].indexOf(query) === -1 ? query : '*'
    let body = filter.body(bodybuilder(), options, from, size)
    if (!isGlobalSearch) {
      each(filters, (filter) => filter.addFilter(body))
      this.addQueryToFilter(query, body, fields)
    }
    body = body.size(0).rawOption('track_total_hits', true).build()
    return this._search({ index, body, preference })
  }

  Client.prototype._addFiltersToBody = function (filters, body) {
    each(filters, (filter) => {
      filter.applyTo(body)
    })
  }

  Client.prototype._addQueryToBody = function (query, body, fields = []) {
    if (isEqual(fields, ['path'])) replace(query, /\//g, '\\/')
    body.query('match_all').addQuery('bool', (b) =>
      b.orQuery('query_string', {
        query,
        fields: fields.length ? fields : undefined
      })
    )
  }

  Client.prototype._addSortToBody = function (name = 'relevance', body) {
    const { field, desc } = find(settings.searchSortFields, { name }) || settings.searchSortFields[0]
    if (name === 'creationDateNewest' || name === 'creationDateOldest') {
      body.sort([
        {
          'metadata.tika_metadata_dcterms_created': {
            order: desc ? 'desc' : 'asc',
            unmapped_type: 'date'
          }
        }
      ])
    } else {
      body.sort(field, desc ? 'desc' : 'asc')
    }
    if (field !== 'path') body.sort('path', 'asc')
  }

  Client.prototype.rootSearch = function (filters, query, fields = []) {
    const body = bodybuilder()
    this._addFiltersToBody(filters, body)
    this._addQueryToBody(query, body, fields)
    body.query('match', 'type', 'Document')
    return body
  }

  Client.prototype._buildBody = function (from, size, filters, query, sort, fields = []) {
    const body = this.rootSearch(filters, query, fields)

    body.from(from).size(size)
    this._addSortToBody(sort, body)
    // Select only the Documents and not the NamedEntities
    // Add an option to exclude the content
    body.rawOption('_source', { includes: ['*'], excludes: ['content', 'content_translated'] })
    // Add an option to highlight fragments in the results
    body.rawOption('highlight', {
      fields: {
        content: {
          fragment_size: 280,
          number_of_fragments: 2,
          pre_tags: ['<mark>'],
          post_tags: ['</mark>']
        },
        'content_translated.content': {
          fragment_size: 280,
          number_of_fragments: 2,
          pre_tags: ['<mark>'],
          post_tags: ['</mark>']
        }
      }
    })
    return body
  }
  Client.prototype.searchDocs = function (
    index,
    query = '*',
    filters = [],
    from = 0,
    size = 25,
    sort = 'relevance',
    fields = []
  ) {
    // Avoid searching for nothing
    query = ['', null, undefined].indexOf(query) === -1 ? query : '*'
    const body = this._buildBody(from, size, filters, query, sort, fields).rawOption('track_total_hits', true).build()
    return this._search({ index, body })
  }

  Client.prototype.countByProject = function (index, query = {}, size = 1000) {
    const aggs = { index: { terms: { field: '_index', size } } }
    const body = { size: 0, query, aggs }
    const preference = 'count-by-project'
    return this._search({ index, body, preference })
  }
}

const elasticsearch = new es.Client({
  host: process.env.VUE_APP_ES_HOST || window.location.hostname + ':' + window.location.port + '/api/index/search',
  plugins: [datasharePlugin],
  requestTimeout: settings.elasticsearch.requestTimeout
})

export { elasticsearch }
