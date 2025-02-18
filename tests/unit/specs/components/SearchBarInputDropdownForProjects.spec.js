import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'

import SearchBarInputDropdownForProjects from '@/components/SearchBarInputDropdownForProjects'
import { Core } from '@/core'

describe('SearchBarInputDropdownForProjects.vue', function () {
  const { i18n, localVue, store, config } = Core.init(createLocalVue()).useAll()
  const router = new VueRouter()

  beforeAll(() => {
    config.set('projects', [
      { name: 'local-datashare', label: 'Default' },
      { name: 'foo', label: 'Foo' },
      { name: 'bar', label: 'Bar' }
    ])
  })

  it('should display a dropdown with 3 options for each project', () => {
    const propsData = { value: [{ name: 'local-datashare' }] }
    const wrapper = mount(SearchBarInputDropdownForProjects, { propsData, i18n, localVue, router, store })
    expect(wrapper.findAll('.dropdown-item')).toHaveLength(3)
  })

  it('should display a dropdown with "Default" selected', () => {
    const propsData = { value: [{ name: 'local-datashare' }] }
    const wrapper = mount(SearchBarInputDropdownForProjects, { propsData, i18n, localVue, router, store })
    expect(wrapper.find('.dropdown-item.active').text().trim()).toBe('Default')
  })

  it('should display a dropdown with "Default" as button content', () => {
    const propsData = { value: [{ name: 'local-datashare' }] }
    const wrapper = mount(SearchBarInputDropdownForProjects, { propsData, i18n, localVue, router, store })
    expect(wrapper.find('.dropdown-toggle').text().trim()).toBe('Default')
  })

  it('should display a dropdown with "Default" and "Foo selected', () => {
    const propsData = { value: [{ name: 'local-datashare' }, { name: 'foo' }] }
    const wrapper = mount(SearchBarInputDropdownForProjects, { propsData, i18n, localVue, router, store })
    expect(wrapper.findAll('.dropdown-item.active').at(0).text().trim()).toBe('Foo')
    expect(wrapper.findAll('.dropdown-item.active').at(1).text().trim()).toBe('Default')
  })

  it('should display a dropdown with "Default" as button content', () => {
    const propsData = { value: [{ name: 'local-datashare' }, { name: 'foo' }] }
    const wrapper = mount(SearchBarInputDropdownForProjects, { propsData, i18n, localVue, router, store })
    expect(wrapper.find('.dropdown-toggle').text().trim()).toBe('2 projects')
  })
})
