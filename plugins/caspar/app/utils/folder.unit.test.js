const { buildFolderTree, getFileName } = require('./folder.cjs')

test('multiple folders with same name', () => {
  const input = [
    { name: 'folder1/file1' },
    { name: 'folder1/file2' },
    { name: 'folder2/folder1/file3'}
  ]

  const expected = [
    {
      file: false,
      name: 'folder1',
      id: expect.any(String),
      files: [
        {
          file: true,
          name: 'folder1/file1',
          id: expect.any(String)
        },
        {
          file: true,
          name: 'folder1/file2',
          id: expect.any(String)
        }
      ]
    },
    {
      file: false,
      name: 'folder2',
      id: expect.any(String),
      files: [
        {
          file: false,
          name: 'folder1',
          id: expect.any(String),
          files: [
            {
              file: true,
              name: 'folder2/folder1/file3',
              id: expect.any(String)
            }
          ]
        }
      ]
    }
  ]

  const result = buildFolderTree(input)
  expect(result).toEqual(expected)
})

test('Folder with one child', () => {
  const input = [{ name: 'folder/file' }]
  const expected = [
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

  const result = buildFolderTree(input)
  expect(result).toEqual(expected)


})

test('Undefined or empty input should return empty array', () => {
  let input = undefined
  const expected = []
  expect(buildFolderTree(input)).toEqual(expected)

  input = []

  expect(buildFolderTree(input)).toEqual(expected)
})


test('Multiple delimiters should return correct structure', () => {
  const input = [{ name: 'folder///file' }]
  const expected = [
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

  const result = buildFolderTree(input)
  expect(result).toEqual(expected)
})

test('Different delimiter (backslash) should return correct structure', () => {
  const input = [{ name: 'folder\\file' }]
  const expected = [
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

  const result = buildFolderTree(input)
  expect(result).toEqual(expected)
})

test('File names with points and dashes should be handled correctly', () => {
  const input = [{ name: 'folder/file.with-dash' }]
  const expected = [
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

  const result = buildFolderTree(input)
  expect(result).toEqual(expected)
})

test('Trailing slash should be folder with no items', () => {
  const input = [{ name: 'folder1/folder2/' }]
  const expected = [
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

  const result = buildFolderTree(input)
  expect(result).toEqual(expected)
})

test('Empty or undefined path should return empty string', () => {
  let input = undefined
  const expected = ''
  expect(getFileName(input)).toEqual(expected)

  input = ''
  expect(getFileName(input)).toEqual(expected)
})

test('Trailing slash should return empty string', () => {
  const input = 'folder/file/'
  const expected = ''
  expect(getFileName(input)).toEqual(expected)
})

test('Delimiters should be handled correctly', () => {
  let input = 'folder\\file'
  const expected = 'file'

  expect(getFileName(input)).toEqual(expected)

  input = 'folder//file'
  expect(getFileName(input)).toEqual(expected)

  input = 'folder/file'
  expect(getFileName(input)).toEqual(expected)
})

test('Multiple folders should return correct file name', () => {
  const input = 'folder1/folder2/file'
  const expected = 'file'
  expect(getFileName(input)).toEqual(expected)
})

test('Dots and dashed should be handled correctly', () => {
  const input = 'folder/file.with.dash'
  const expected = 'file.with.dash'
  expect(getFileName(input)).toEqual(expected)
})
