import { createLocalVue, mount, shallowMount } from '@vue/test-utils'

import { App } from '@/main'
import { datashare } from '@/store/modules/search'
import { jsonOk } from 'tests/unit/tests_utils'
import SearchResultsAppliedFilters from '@/components/SearchResultsAppliedFilters'

const { localVue, i18n, store, router } = App.init(createLocalVue()).useAll()

describe('SearchResultsAppliedFilters.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = shallowMount(SearchResultsAppliedFilters, { localVue, i18n, store })
    jest.spyOn(datashare, 'fetch')
    datashare.fetch.mockReturnValue(jsonOk())
  })

  afterEach(async () => store.dispatch('search/reset'))

  afterAll(() => datashare.fetch.mockRestore())

  describe('displays applied filters', () => {
    it('should display 2 applied filters', async () => {
      await store.dispatch('search/query', { query: 'document test', from: 0, size: 3 })

      expect(wrapper.findAll('.search-results-header__applied-filters search-results-applied-filter-stub')).toHaveLength(2)
    })

    it('should display 1 applied filter', () => {
      store.commit('search/addFacetValue', { name: 'contentType', value: 'term_01' })

      expect(wrapper.findAll('.search-results-header__applied-filters search-results-applied-filter-stub')).toHaveLength(1)
    })

    it('should translate the label of a facet', () => {
      store.commit('search/addFacetValue', { name: 'contentType', value: 'text/plain' })

      expect(wrapper.vm.filters[0].label).toEqual('Plain text document')
    })

    it('should translate the label of a facet date', () => {
      store.commit('search/addFacetValue', { name: 'indexingDate', value: 1556668800000 })

      expect(wrapper.vm.filters[0].label).toEqual('2019-05')
    })

    it('should translate the label of a facet date range', () => {
      store.commit('search/addFacetValue', { name: 'creationDate', value: [1556668800000, 1566908357980] })

      expect(wrapper.vm.filters[0].label).toEqual('05/01/2019')
      expect(wrapper.vm.filters[1].label).toEqual('08/27/2019')
    })

    it('should translate in French the label of a facet date range', () => {
      localStorage.setItem('locale', 'fr')
      store.commit('search/addFacetValue', { name: 'creationDate', value: [1556668800000, 1566908357980] })

      expect(wrapper.vm.filters[0].label).toEqual('01/05/2019')
      expect(wrapper.vm.filters[1].label).toEqual('27/08/2019')
    })

    it('should translate the label of a facet yes no', () => {
      store.commit('search/addFacetValue', { name: 'starred', value: true })

      expect(wrapper.vm.filters[0].label).toEqual('Starred')
    })

    it('should set facet as positive applied facet', () => {
      store.commit('search/addFacetValue', { name: 'contentType', value: 'term_01' })

      expect(wrapper.vm.filters[0].negation).toBeFalsy()
    })

    it('should set excluded facet as negative applied facet', () => {
      store.commit('search/addFacetValue', { name: 'contentType', value: 'term_01' })
      store.commit('search/toggleFacet', 'contentType')

      expect(wrapper.vm.filters[0].negation).toBeTruthy()
    })
  })

  describe('deletes applied filters', () => {
    beforeEach(() => {
      wrapper = mount(SearchResultsAppliedFilters, { localVue, i18n, router, store })
    })

    it('should remove the "AND" on last applied filter deletion', async () => {
      await store.dispatch('search/query', { query: 'term_01 AND term_02', from: 0, size: 3 })
      wrapper.findAll('.search-results-header__applied-filters .search-results-header__applied-filters__filter').at(1).trigger('click')

      expect(store.state.search.query).toBe('term_01')
    })

    it('should remove the "OR" on last applied filter deletion', async () => {
      await store.dispatch('search/query', { query: 'term_01 OR term_02', from: 0, size: 3 })
      wrapper.findAll('.search-results-header__applied-filters .search-results-header__applied-filters__filter').at(1).trigger('click')

      expect(store.state.search.query).toBe('term_01')
    })
  })
})
