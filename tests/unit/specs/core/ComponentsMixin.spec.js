import { createLocalVue, shallowMount } from '@vue/test-utils'
import { basename } from 'path'

import { Core } from '@/core'

describe('ComponentsMixin', () => {
  let core, localVue

  beforeEach(() => {
    localVue = createLocalVue()
    core = Core.init(localVue).useAll()
    // Mock the `lazyComponents` to ensure it returns an API similar to Webpack's
    const context = async (name = null) => ({
      default: { name: basename(name, '.vue'), template: `<div>${name}</div>` }
    })
    context.keys = () => ['./TreeView.vue', './PageIcon.vue', './Fa.js', './widget/WidgetDiskUsage.vue']
    jest.spyOn(core, 'lazyComponents', 'get').mockReturnValue(context)
  })

  it('should find component by name with exact match', async () => {
    const TreeView = await core.findComponent('TreeView')
    expect(TreeView.name).toBe('TreeView')
  })

  it('should find component by name with wrong case', async () => {
    const TreeView = await core.findComponent('treeView')
    expect(TreeView.name).toBe('TreeView')
  })

  it('should find component by name with kebab case', async () => {
    const TreeView = await core.findComponent('tree-view')
    expect(TreeView.name).toBe('TreeView')
  })

  it('should find component by name with underscore case', async () => {
    const TreeView = await core.findComponent('tree_view')
    expect(TreeView.name).toBe('TreeView')
  })

  it('should return null with unknown component', async () => {
    expect(await core.findComponent('foo')).toBeNull()
  })

  it('should throw an exception with unknown component', async () => {
    expect.assertions(1)
    try {
      await core.getComponent('foo')
    } catch (e) {
      expect(e.message).toEqual("Cannot find component 'foo'")
    }
  })

  it('should find an instantiable component', async () => {
    const PageIcon = await core.findComponent('PageIcon')
    const wrapper = shallowMount(PageIcon, { localVue })
    expect(wrapper.findComponent({ name: 'PageIcon' }).exists()).toBeTruthy()
  })

  it('should find component in sub-folder', async () => {
    const WidgetDiskUsage = await core.findComponent('widget/WidgetDiskUsage')
    expect(WidgetDiskUsage.name).toBe('WidgetDiskUsage')
  })

  it('should find component in sub-folder with "./" prefix', async () => {
    const WidgetDiskUsage = await core.findComponent('./widget/WidgetDiskUsage')
    expect(WidgetDiskUsage.name).toBe('WidgetDiskUsage')
  })
})
