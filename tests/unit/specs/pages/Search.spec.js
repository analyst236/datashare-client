import cloneDeep from 'lodash/cloneDeep'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import { errors as esErrors } from 'elasticsearch-browser'
import VueRouter from 'vue-router'
import Vuex from 'vuex'

// import { flushPromises } from 'tests/unit/tests_utils'
import { Core } from '@/core'
import Search from '@/pages/Search'
import { state, getters, mutations } from '@/store/modules/search'
const flushPromises = () => new Promise((resolve) => setImmediate(resolve))
const flushPromisesAndAdvanceTimers = async (time) => {
  jest.advanceTimersByTime(time)
  await flushPromises()
}

describe('Search.vue', () => {
  let store
  const { i18n, localVue } = Core.init(createLocalVue()).useAll()
  const router = new VueRouter()
  const actionsStore = { query: jest.fn(), refresh: jest.fn(), updateFromRouteQuery: jest.fn() }
  let wrapper = null

  beforeEach(() => {
    store = new Vuex.Store({
      modules: {
        search: {
          namespaced: true,
          state: cloneDeep(state),
          getters: cloneDeep(getters),
          mutations: cloneDeep(mutations),
          actions: actionsStore
        },
        document: {
          namespaced: true
        }
      }
    })
    wrapper = shallowMount(Search, { i18n, localVue, router, store })
  })

  it('should search query on component creation', async () => {
    expect(actionsStore.query).toBeCalledTimes(1)
  })

  it('should refresh the view on custom event', async () => {
    actionsStore.query.mockClear()
    wrapper.vm.$root.$emit('index::delete::all')

    expect(actionsStore.query).toBeCalledTimes(1)
  })

  it('should execute a new search on event "filter::starred::refresh"', () => {
    wrapper.vm.$root.$emit('filter::starred::refresh')

    expect(actionsStore.refresh).toBeCalledTimes(1)
  })

  it('should redirect to the complete query', async () => {
    const query = 'this is a query'
    store.commit('search/query', query)
    await flushPromises()
    expect(wrapper.find('.search__body__backdrop').props('to')).toMatchObject({ name: 'search', query: { q: query } })
  })

  describe('refresh button on request timeout', () => {
    it('should return true for isRequestTimeoutError if error is RequestTimeout', () => {
      store.commit('search/error', new esErrors.RequestTimeout())
      expect(wrapper.vm.isRequestTimeoutError).toBeTruthy()
    })

    it('should return false for isRequestTimeoutError if error is NOT RequestTimeout', () => {
      store.commit('search/error', new esErrors.NoConnections())
      expect(wrapper.vm.isRequestTimeoutError).toBeFalsy()
    })

    it('should display a button to try again if error is RequestTimeout', async () => {
      store.commit('search/error', new esErrors.RequestTimeout())
      await flushPromises()
      expect(wrapper.find('b-button-stub').exists()).toBeTruthy()
    })
  })

  describe('the progress bar', () => {
    beforeEach(() => {
      // Use fake timers to control times!
      // @see https://jestjs.io/fr/docs/timer-mocks
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })
    it('should increase of 2 per second', async () => {
      // the timeout indicate the progress is finished after the time advance
      setTimeout(() => store.commit('search/isReady', true), 6000)
      store.commit('search/isReady', false)
      await flushPromises()

      await flushPromisesAndAdvanceTimers(5500)

      expect(wrapper.vm.$Progress.get()).toBe(10)
      expect(wrapper.vm.intervalId).not.toBe(-1)
    })

    it('should be reset', async () => {
      setTimeout(() => store.commit('search/isReady', true), 5000)
      store.commit('search/isReady', false)
      await flushPromises()

      await flushPromisesAndAdvanceTimers(5500)

      expect(wrapper.vm.$Progress.get()).toBe(100)
      expect(wrapper.vm.intervalId).toBe(-1)
    })
  })
})
