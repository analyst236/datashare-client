import { storeBuilder } from '@/store/storeBuilder'

describe('DocumentNotesStore', () => {
  const project = 'projectName'
  let store, api
  beforeAll(() => {
    api = {
      retrieveNotes: jest.fn()
    }
    store = storeBuilder(api)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    store.commit('documentNotes/reset')
  })

  it('should call the retrieveNotes url', async () => {
    await store.dispatch('documentNotes/retrieveNotes', { project })

    expect(api.retrieveNotes).toBeCalledTimes(1)
    expect(api.retrieveNotes).toBeCalledWith(project)
  })

  it('should call the API endpoint only once', async () => {
    await store.dispatch('documentNotes/retrieveNotes', { project })
    await store.dispatch('documentNotes/retrieveNotes', { project })

    expect(api.retrieveNotes).toBeCalledTimes(1)
    expect(api.retrieveNotes).toBeCalledWith(project)
  })

  it('should filter on document path', async () => {
    const note = 'note'
    const variant = 'variant'
    store.commit('documentNotes/setNotes', {
      project,
      notes: [
        { note, project, variant, path: '/this/is/a/' },
        { note, project, variant, path: '/this/is/a/path/to' },
        { note, project, variant, path: '/this/is/a/path/to/document.txt' },
        { note, project, variant, path: '/this/is/another/path' }
      ]
    })

    const notes = await store.dispatch('documentNotes/filterNotesByPath', {
      project,
      path: '/this/is/a/path/to/document.txt'
    })

    expect(notes).toHaveLength(3)
  })
})
