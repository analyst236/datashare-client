import { addLocalSearchMarks, isUrl } from '@/utils/strings'

describe('strings', () => {
  describe('addLocalSearchMarks', () => {
    it('should wrap "dolor" (lowercase) with tags in string without HTML', () => {
      const { content } = addLocalSearchMarks('Lorem ipsum dolor', { label: 'dolor' })
      expect(content).toBe('Lorem ipsum <mark class="local-search-term">dolor</mark>')
    })

    it('shouldn\'t wrap anything', () => {
      const { content } = addLocalSearchMarks('Lorem ipsum dolor', { label: 'sit amet' })
      expect(content).toBe('Lorem ipsum dolor')
    })

    it('should wrap "DOLOR" (uppercase) with tags in string without HTML', () => {
      const { content } = addLocalSearchMarks('Lorem ipsum DOLOR', { label: 'dolor' })
      expect(content).toBe('Lorem ipsum <mark class="local-search-term">DOLOR</mark>')
    })

    it('should wrap "DOLOR" with tags in uppercase string without HTML', () => {
      const { content } = addLocalSearchMarks('LOREM IPSUM DOLOR', { label: 'dolor' })
      expect(content).toBe('LOREM IPSUM <mark class="local-search-term">DOLOR</mark>')
    })

    it('should wrap "dolor" with tags string without HTML even with a toekn in uppercase', () => {
      const { content } = addLocalSearchMarks('Lorem ipsum dolor', { label: 'DOLOR' })
      expect(content).toBe('Lorem ipsum <mark class="local-search-term">dolor</mark>')
    })

    it('should wrap "Lorem ipsum" with tags string without HTML even with a toekn in camelcase', () => {
      const { content } = addLocalSearchMarks('Lorem ipsum dolor', { label: 'Lorem Ipsum' })
      expect(content).toBe('<mark class="local-search-term">Lorem ipsum</mark> dolor')
    })

    it('should wrap "Lorem" with tags in string without HTML', () => {
      const { content } = addLocalSearchMarks('Lorem ipsum dolor', { label: 'Lorem' })
      expect(content).toBe('<mark class="local-search-term">Lorem</mark> ipsum dolor')
    })

    it('should wrap "dolor" with tags in string with HTML', () => {
      const { content } = addLocalSearchMarks('Lorem <strong>ipsum</strong> dolor', { label: 'dolor' })
      expect(content).toBe('Lorem <strong>ipsum</strong> <mark class="local-search-term">dolor</mark>')
    })

    it('should wrap "ipsum" with tags in string with HTML', () => {
      const { content } = addLocalSearchMarks('Lorem <strong>ipsum</strong> dolor', { label: 'ipsum' })
      expect(content).toBe('Lorem <strong><mark class="local-search-term">ipsum</mark></strong> dolor')
    })

    it('should wrap "ipsum" with tags in string with HTML, wrapped with a span', () => {
      const { content } = addLocalSearchMarks('<span>Lorem <strong>ipsum</strong> dolor</span>', { label: 'ipsum' })
      expect(content).toBe('<span>Lorem <strong><mark class="local-search-term">ipsum</mark></strong> dolor</span>')
    })

    it('should wrap "dolor" in a deeply nested string', () => {
      const { content } = addLocalSearchMarks('<i>Lorem</i> <strong>ipsum <span>dolor</span></strong>', { label: 'dolor' })
      expect(content).toBe('<i>Lorem</i> <strong>ipsum <span><mark class="local-search-term">dolor</mark></span></strong>')
    })

    it('should wrap "Lorem" in a deeply nested string', () => {
      const { content } = addLocalSearchMarks('<i>Lorem</i> <strong>ipsum <span>dolor</span></strong>', { label: 'lorem' })
      expect(content).toBe('<i><mark class="local-search-term">Lorem</mark></i> <strong>ipsum <span>dolor</span></strong>')
    })

    it('shouldn\'t wrap "Lorem ipsum" in different tags', () => {
      const { content } = addLocalSearchMarks('<i>Lorem</i> <strong>ipsum <span>dolor</span></strong>', { label: 'Lorem ipsum' })
      expect(content).toBe('<i>Lorem</i> <strong>ipsum <span>dolor</span></strong>')
    })

    it('should wrap regex', () => {
      const { content } = addLocalSearchMarks('France is not a tax heaven.\nBut most probably a taxidermists country.', { label: 'tax.*', regex: true })
      expect(content).toBe('France is not a <mark class="local-search-term">tax heaven. But most probably a taxidermists country.</mark>')
    })

    it('should display HTML characters', () => {
      const { content } = addLocalSearchMarks('Lorem ipsum <dolor & other > or', { label: 'ipsum' })
      expect(content).toBe('Lorem <mark class="local-search-term">ipsum</mark> <dolor & other > or')
    })

    it('should preserve HTML tags', () => {
      const { content } = addLocalSearchMarks('Lorem <div>ipsum</div> <span>dolor</span>', { label: 'ipsum' })
      expect(content).toBe('Lorem <div><mark class="local-search-term">ipsum</mark></div> <span>dolor</span>')
    })

    it('should ignore carriage return', () => {
      const { content, localSearchOccurrences } = addLocalSearchMarks('content content Donald \nTrump content', { label: 'Donald Trump' })

      expect(localSearchOccurrences).toBe(1)
      expect(content).toBe('content content <mark class="local-search-term">Donald Trump</mark> content')
    })
  })

  describe('isUrl', () => {
    it('should return false if it is NOT an url', () => {
      const url = 'no_url'
      expect(isUrl(url)).toBeFalsy()
    })

    it('should return true if it is an url', () => {
      const url = 'http://www.google.fr'
      expect(isUrl(url)).toBeTruthy()
    })
  })
})
