import { createLocalVue, shallowMount } from '@vue/test-utils'
import { flushPromises } from 'tests/unit/tests_utils'

import LocalesMenu from '@/components/LocalesMenu'
import { Core } from '@/core'

describe('LocalesMenu', () => {
  const core = Core.init(createLocalVue()).useAll()
  const { localVue, i18n } = core
  let wrapper = null

  beforeEach(async () => {
    await core.loadI18Locale('en')
  })

  afterAll(async () => {
    await core.loadI18Locale('en')
  })

  describe('should change the interface language according to configuration', () => {
    it('should display the interfaces in English by default', () => {
      wrapper = shallowMount(LocalesMenu, { localVue, i18n })

      expect(wrapper.find('.locales-menu__button').text()).toBe('English')
    })

    it('should display the interface in French if configuration says so', () => {
      core.setI18nLocale('fr')
      wrapper = shallowMount(LocalesMenu, { localVue, i18n })

      expect(wrapper.find('.locales-menu__button').text()).toBe('Français')
    })

    it('should display the interface in Spanish if configuration says so', () => {
      core.setI18nLocale('es')
      wrapper = shallowMount(LocalesMenu, { localVue, i18n })

      expect(wrapper.find('.locales-menu__button').text()).toBe('Español')
    })
  })

  describe('b-popover menu', () => {
    beforeEach(() => {
      wrapper = shallowMount(LocalesMenu, { localVue, i18n })
    })

    it('should display a menu with 4 languages', () => {
      expect(wrapper.findAll('b-popover-stub .dropdown-item')).toHaveLength(4)
    })

    it('should switch from English to French interface language', async () => {
      expect(wrapper.find('.locales-menu__button').text()).toBe('English')

      wrapper.findAll('.dropdown-item').at(1).trigger('click')
      await flushPromises()

      expect(wrapper.find('.locales-menu__button').text()).toBe('Français')
      expect(localStorage.getItem('locale')).toBe('fr')
    })

    it('should switch from English to Spanish interface language', async () => {
      expect(wrapper.find('.locales-menu__button').text()).toBe('English')

      wrapper.findAll('.dropdown-item').at(2).trigger('click')
      await flushPromises()

      expect(wrapper.find('.locales-menu__button').text()).toBe('Español')
      expect(localStorage.getItem('locale')).toBe('es')
    })

    it('should switch from English to Japan interface language', async () => {
      expect(wrapper.find('.locales-menu__button').text()).toBe('English')

      wrapper.findAll('.dropdown-item').at(3).trigger('click')
      await flushPromises()

      expect(wrapper.find('.locales-menu__button').text()).toBe('日本語')
      expect(localStorage.getItem('locale')).toBe('ja')
    })
  })
})
