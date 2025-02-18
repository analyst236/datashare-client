import { EventBus } from '@/utils/event-bus'
import { Api } from '@/api'

describe('Datashare backend client', () => {
  let json = null
  let api
  const mockAxios = { request: jest.fn() }
  beforeAll(() => {
    api = new Api(mockAxios, EventBus)
  })

  beforeEach(() => {
    mockAxios.request.mockClear()
    mockAxios.request.mockResolvedValue({ data: {} }) // TODO : it should be a given with response data not a before each
  })

  it('should return backend response to index', async () => {
    json = await api.index({})
    expect(json).toEqual({})
    expect(mockAxios.request).toBeCalledWith(
      expect.objectContaining({
        url: Api.getFullUrl('/api/task/batchUpdate/index/file'),
        method: 'POST',
        data: {
          options: {
            filter: true,
            ocr: false
          }
        }
      })
    )
  })

  it('should return backend response to index when language is specified', async () => {
    json = await api.index({ language: 'fra' })
    expect(json).toEqual({})
    expect(mockAxios.request).toBeCalledWith(
      expect.objectContaining({
        url: Api.getFullUrl('/api/task/batchUpdate/index/file'),
        method: 'POST',
        data: {
          options: {
            filter: true,
            ocr: false,
            language: 'fra',
            ocrLanguage: 'fra'
          }
        }
      })
    )
  })

  it('should return backend response to findNames', async () => {
    json = await api.findNames('pipeline', {})
    expect(json).toEqual({})
  })

  it('should return backend response to stopPendingTasks', async () => {
    json = await api.stopPendingTasks()
    expect(json).toEqual({})
  })

  it('should return backend response to stopTask', async () => {
    json = await api.stopTask()
    expect(json).toEqual({})
  })

  it('should return backend response to deleteDoneTasks', async () => {
    json = await api.deleteDoneTasks()
    expect(json).toEqual({})
  })

  it('should return backend response to getTasks', async () => {
    json = await api.getTasks()
    expect(json).toEqual({})
  })

  it('should return backend response to createIndex', async () => {
    json = await api.createIndex()
    expect(json).toEqual({})
  })

  it('should return backend response to deleteAll', async () => {
    json = await api.deleteAll()
    expect(json).toEqual({})
  })

  it('should return backend response to getVersion', async () => {
    json = await api.getVersion()
    expect(json).toEqual({})
  })

  it('should return backend response to getSettings', async () => {
    json = await api.getSettings()
    expect(json).toEqual({})
  })

  it('should throw a 401 if getSettings return a error', async () => {
    mockAxios.request.mockRejectedValue({ response: { status: 401 } })
    const mockCallback = jest.fn()
    EventBus.$on('http::error', mockCallback)
    try {
      await api.getSettings()
    } catch (error) {
      expect(error.response.status).toBe(401)
    }
    expect(mockAxios.request).toBeCalledTimes(1)
    expect(mockCallback).toBeCalledTimes(1)
    expect(mockAxios.request).toBeCalledWith({ url: Api.getFullUrl('/settings') })

    mockAxios.request.mockResolvedValue({ data: {} })
  })

  it('should return backend response to setSettings', async () => {
    json = await api.setSettings({})
    expect(json).toEqual({})
  })

  it('should return backend response to deleteNamedEntitiesByMentionNorm', async () => {
    json = await api.deleteNamedEntitiesByMentionNorm('mentionNorm')
    expect(json).toEqual({})
  })

  it('should return backend response to getSource', async () => {
    json = await api.getSource('relativeUrl')
    expect(json).toEqual({})
  })

  it('should return backend response to fetchIndicesStarredDocuments', async () => {
    json = await api.getStarredDocuments('project')
    expect(json).toEqual({})
  })

  it('should return backend response to starDocument', async () => {
    json = await api.getStarredDocuments('project', 'documentId')
    expect(json).toEqual({})
  })

  it('should return backend response to unstarDocument', async () => {
    json = await api.getStarredDocuments('project', 'documentId')
    expect(json).toEqual({})
  })

  it('should return backend response to tagDocument', async () => {
    json = await api.tagDocument('project', 'documentId', 'routingId', ['tag_01'])
    expect(json).toEqual({})
  })

  it('should return backend response to untagDocument', async () => {
    json = await api.untagDocument('project', 'documentId', 'routingId', ['tag_01'])
    expect(json).toEqual({})
  })

  it('should return backend response to batchSearch', async () => {
    const name = 'name'
    const csvFile = 'csvFile'
    const description = 'description'
    const project = 'project'
    const phraseMatch = false
    const fuzziness = 2
    const fileTypes = [{ mime: 'application/pdf' }, { mime: 'text/plain' }]
    const paths = ['one', 'or', 'two', 'paths']
    const published = true
    json = await api.batchSearch(
      name,
      csvFile,
      description,
      project,
      phraseMatch,
      fuzziness,
      fileTypes,
      paths,
      published
    )

    const data = new FormData()
    data.append('name', name)
    data.append('csvFile', csvFile)
    data.append('description', description)
    data.append('phrase_matches', phraseMatch)
    data.append('fuzziness', fuzziness)
    data.append('fileTypes', 'application/pdf')
    data.append('fileTypes', 'text/plain')
    data.append('paths', 'one')
    data.append('paths', 'or')
    data.append('paths', 'two')
    data.append('paths', 'paths')
    data.append('published', published)
    expect(json).toEqual({})
    expect(mockAxios.request).toBeCalledWith(
      expect.objectContaining({
        url: Api.getFullUrl('/api/batch/search/project'),
        method: 'POST',
        data
      })
    )
  })

  it('should return backend response to getBatchSearch', async () => {
    json = await api.getBatchSearch(12)
    expect(json).toEqual({})
  })

  it('should return backend response to getBatchSearches', async () => {
    json = await api.getBatchSearches()
    expect(json).toEqual({})
  })

  it('should return backend response to getBatchSearchResults', async () => {
    json = await api.getBatchSearchResults()
    expect(json).toEqual({})
  })

  it('should return backend response to deleteBatchSearches', async () => {
    json = await api.deleteBatchSearches()
    expect(json).toEqual({})
  })

  it('should return backend response to setMarkAsRecommended', async () => {
    json = await api.setMarkAsRecommended()
    expect(json).toEqual({})
  })

  it('should return backend response to setUnmarkAsRecommended', async () => {
    json = await api.setUnmarkAsRecommended()
    expect(json).toEqual({})
  })

  it('should return backend response to getRecommendationsByDocuments', async () => {
    json = await api.getRecommendationsByDocuments()
    expect(json).toEqual({})
  })

  it('should return backend response to fetchIndicesRecommendations', async () => {
    json = await api.getRecommendationsByProject()
    expect(json).toEqual({})
  })

  it('should return backend response to getDocumentsRecommendedBy', async () => {
    json = await api.getDocumentsRecommendedBy()
    expect(json).toEqual({})
  })

  it('should return backend response to getNerPipelines', async () => {
    json = await api.getNerPipelines()
    expect(json).toEqual({})
  })

  it('should return backend response to createApiKey', async () => {
    json = await api.createApiKey()
    expect(json).toEqual({})
  })

  it('should return backend response to deleteApiKey', async () => {
    json = await api.deleteApiKey()
    expect(json).toEqual({})
  })

  it('should return backend response to getPlugins', async () => {
    json = await api.getPlugins()
    expect(json).toEqual({})
  })

  it('should return backend response to installPluginFromId', async () => {
    json = await api.installPluginFromId()
    expect(json).toEqual({})
  })

  it('should return backend response to installPluginFromUrl', async () => {
    json = await api.installPluginFromUrl()
    expect(json).toEqual({})
  })

  it('should return backend response to uninstallPlugin', async () => {
    json = await api.uninstallPlugin()
    expect(json).toEqual({})
  })

  it('should return backend response to getExtensions', async () => {
    json = await api.getExtensions()
    expect(json).toEqual({})
  })

  it('should return backend response to installExtensionFromId', async () => {
    json = await api.installExtensionFromId()
    expect(json).toEqual({})
  })

  it('should return backend response to installExtensionFromUrl', async () => {
    json = await api.installExtensionFromUrl()
    expect(json).toEqual({})
  })

  it('should return backend response to uninstallExtension', async () => {
    json = await api.uninstallExtension()
    expect(json).toEqual({})
  })

  it('should send a post JSON for copyBatchSearch', async () => {
    json = await api.copyBatchSearch('12', 'copyName', 'copyDescription')
    const data = { description: 'copyDescription', name: 'copyName' }
    expect(json).toEqual({})
    expect(mockAxios.request).toBeCalledWith({
      url: Api.getFullUrl('/api/batch/search/copy/12'),
      method: 'POST',
      data,
      responseType: 'text',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
    })
  })

  it('should return backend response to getUserHistory', async () => {
    json = await api.getUserHistory()
    expect(json).toEqual({})
  })

  it('should send a put JSON for addUserHistoryEvent', async () => {
    json = await api.addUserHistoryEvent(['project1', 'project2'], 'DOCUMENT', 'docName', 'docUri')
    const data = { projectIds: ['project1', 'project2'], type: 'DOCUMENT', name: 'docName', uri: 'docUri' }
    expect(json).toEqual({})
    expect(mockAxios.request).toBeCalledWith({
      url: Api.getFullUrl('/api/users/me/history'),
      method: 'PUT',
      data,
      responseType: 'text',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
    })
  })

  it('should return a backend response to deleteUserHistory', async () => {
    json = await api.deleteUserHistory()
    expect(json).toEqual({})
  })

  it('should return a backend response to deleteUserHistoryEvent', async () => {
    json = await api.deleteUserHistoryEvent('event-id')
    expect(json).toEqual({})
  })

  it('should return a backend response to createProject', async () => {
    const data = {}
    json = await api.createProject(data)
    expect(json).toEqual({})
    expect(mockAxios.request).toBeCalledWith({
      url: Api.getFullUrl('/api/project/'),
      method: 'POST',
      data,
      responseType: 'text',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
    })
  })

  it('should return a backend response to updateProject', async () => {
    const data = { name: 'hello' }
    json = await api.updateProject(data)
    expect(json).toEqual({})
    expect(mockAxios.request).toBeCalledWith({
      url: Api.getFullUrl('/api/project/hello'),
      method: 'PUT',
      data,
      responseType: 'text',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
    })
  })

  it('should return a backend response to deleteProject', async () => {
    const name = 'hello'
    json = await api.deleteProject(name)
    expect(json).toEqual({})
    expect(mockAxios.request).toBeCalledWith({
      url: Api.getFullUrl('/api/project/hello'),
      method: 'DELETE',
      responseType: 'text',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
    })
  })

  it('should emit an error if the backend response has a bad status', async () => {
    const error = new Error('Forbidden')
    mockAxios.request.mockReturnValue(Promise.reject(error))
    const mockCallback = jest.fn()
    EventBus.$on('http::error', mockCallback)

    try {
      await api.createIndex()
    } catch (err) {
      expect(err).toEqual(error)
    }

    expect(mockCallback.mock.calls).toHaveLength(1)
    expect(mockCallback.mock.calls[0][0]).toEqual(error)
  })
})
