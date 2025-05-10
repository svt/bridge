const { buildFolderTree, getFileName } = require('./library.cjs')

describe('buildFolderTree function', () => {
  const testCases = [
    {
      description: 'Folder with one child',
      input: [{ name: 'folder/file' }],
      expected: [
        {
          file: false,
          name: 'folder',
          id: expect.any(String),
          files: [
            {
              file: true,
              name: 'folder/file',
              id: expect.any(String)
            }
          ]
        }
      ]
    },
    {
      description: 'Undefined input should return empty array',
      input: undefined,
      expected: []
    },
    {
      description: 'Empty input should return empty array',
      input: [],
      expected: []
    },
    {
      description: 'Multiple delimiters should return correct structure',
      input: [{ name: 'folder//file' }],
      expected: [
        {
          file: false,
          name: 'folder',
          id: expect.any(String),
          files: [
            {
              file: true,
              name: 'folder/file',
              id: expect.any(String)
            }
          ]
        }
      ]
    },
    {
      description: 'Different delimiter (backslash) should return correct structure',
      input: [{ name: 'folder\\file' }],
      expected: [
        {
          file: false,
          name: 'folder',
          id: expect.any(String),
          files: [
            {
              file: true,
              name: 'folder/file',
              id: expect.any(String)
            }
          ]
        }
      ]
    },
    {
      description: 'File names with points and dashes should be handled correctly',
      input: [{ name: 'folder/file.with-dash' }],
      expected: [
        {
          file: false,
          name: 'folder',
          id: expect.any(String),
          files: [
            {
              file: true,
              name: 'folder/file.with-dash',
              id: expect.any(String)
            }
          ]
        }
      ]
    },
    {
      description: 'Trailing slash should be folder with no items',
      input: [{ name: 'folder1/folder2/' }],
      expected: [
        {
          file: false,
          name: 'folder1',
          id: expect.any(String),
          files: [
            {
              file: false,
              name: 'folder2',
              id: expect.any(String),
              files: []
            }
          ]
        }
      ]
    }
  ]

  testCases.forEach(({ description, input, expected }) => {
    it(description, () => {
      const result = buildFolderTree(input)
      expect(result).toEqual(expected)
    })
  })
})

describe('getFileName function', () => {
  const testCases = [
    {
      description: 'Should return the correct file name for a simple path',
      input: 'folder/file.txt',
      expected: 'file.txt'
    },
    {
      description: 'Should return the correct file name when path has multiple folders',
      input: 'folder/subfolder/file.txt',
      expected: 'file.txt'
    },
    {
      description: 'Should handle paths with trailing slash',
      input: 'folder/file/with/trailing/slash/',
      expected: 'slash'
    },
    {
      description: 'Should return the file name for a file in the root directory',
      input: 'file.txt',
      expected: 'file.txt'
    },
    {
      description: 'Should return an empty string for an empty path',
      input: '',
      expected: ''
    },
    {
      description: 'Should handle paths with multiple slashes correctly',
      input: 'folder//file.txt',
      expected: 'file.txt'
    },
    {
      description: 'Should return the correct file name for path with backslashes',
      input: 'folder\\file.txt',
      expected: 'file.txt'
    },
    {
      description: 'Should return the correct file name for a path with dots',
      input: 'folder/file.with.dots.txt',
      expected: 'file.with.dots.txt'
    },
    {
      description: 'Should return the last part of path if file has no extension',
      input: 'folder/file',
      expected: 'file'
    },
    {
      description: 'If path is undefined, should return empty string',
      input: undefined,
      expected: ''
    }
  ]

  testCases.forEach(({ description, input, expected }) => {
    it(description, () => {
      const result = getFileName(input)
      expect(result).toEqual(expected)
    })
  })
})
