# Contribution guidelines

## Welcome
Welcome to the contribution guidelines, we're glad you want to help make Bridge even better! Please read through these guidelines before going on your journey of contributions to help us keep the repository as neat as possible.

There are many ways to contribute - finding bugs, adding documentation and fixing issues are always well appreciated.

## Table of contents
- [Project structure](#project-structure)
- [Naming conventions](#naming-conventions)
  - [Branches](#branches)
  - [Commits](#commits)
- [Code style](#code-style)

## Project structure
See the documentation on the project structure before getting started.  
[Project structure documentation](docs/structure.md)

## Naming conventions  
### Branches  
Branches are named in the `group/name` format where all characters are lowercase and spaces are replaced with dashes `-`.

Valid group names are  
```
feature/  New features visible to the user
chore/    Maintenence tasks not visible to the user
style/    Style changes
fix/      Bug fixes
wip/      Long term work in progress
```

### Commits  
Commit messages are written in present-tense, imperative-style, always starting with a capital letter.

`Add the wonderful new feature`  
`Fix #42 causing letters to turn upside down`  
`Make this do that`

## Code style
We follow the [Standard JS](http://standardjs.com) coding conventions and all pull requests will be linted automatically as part of the test workflow before being allowed to be merged.