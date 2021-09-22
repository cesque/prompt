#!/usr/bin/env node

const path = require('path')
const git = require('simple-git/promise')()
const execSync = require('child_process').execSync
const repoName = require('git-repo-name')

let currentPath = path.resolve()
let currentDirectory = path.basename(currentPath)
if(currentDirectory.length == 0) currentDirectory = '/'

const colors = [
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'white'
]

let directoryBackground = {bg: 'black', brightBg: true}

let repoColors = {
    'aa-nextjs': {bg: 'yellow', brightBg: false, fg: 'black', brightFg: false},
    'aa-docker': {bg: 'cyan', brightBg: false, fg: 'black', brightFg: true},
    aa: {bg: 'magenta', brightBg: false, fg: 'yellow', brightFg: true},
    default: {bg: 'black', brightBg: true, fg: 'white', brightFg: false},
}

let repoContractions = {
    'aa-nextjs': 'next',
    'aa-docker': 'docker',
}

let branchColors = {
    master: {bg: 'red'},
    develop: {bg: 'green', fg: 'black'},
    support: {fg: 'black', bg: 'cyan'},
    feature: {fg: 'black', bg: 'yellow'},
    fix: {bg: 'magenta', brightFg: true},
    default: {bg: 'white', fg: 'black'},
}

// let seperatorCharacter = '\ue0b0'
// let seperatorCharacter = '\ue0b4'
let seperatorCharacter = '\ue0bc'

;(async _ => {
    let branch = ''
    try {
        // see if we are in a git repo, otherwise throw error
        execSync('git rev-parse 1>/dev/null 2>/dev/null', {encoding: 'utf8'})
        
        let repo = repoName.sync()

        let branchInfo = await git.branch()
        let remotes = await git.getRemotes(true)
        let isNext = remotes.length > 0 && remotes[0].refs.fetch.includes('nextjs')
        let current = branchInfo.current

        let repoColor = null
        let branchColor = null

        switch(true) {
            case /^(aa-nextjs)$/.test(repo):
                repoColor = repoColors['aa-nextjs']
                break
            case /^(aa-docker)$/.test(repo):
                repoColor = repoColors['aa-docker']
                break
            case /^(aa)$/.test(repo):
                repoColor = repoColors['aa']
                break
            default:
                repoColor = repoColors.default
                break
        }

        switch(true) {
            case /^(master|main)$/.test(current):
                if(isNext) {
                    branchColor = branchColors.develop
                } else {
                    branchColor = branchColors.master
                }
                break
            case /^stable$/.test(current) && isNext:
                branchColor = branchColors.master
                break
            case /^develop$/.test(current):
                branchColor = branchColors.develop
                break
            case /^support/.test(current):
                branchColor = branchColors.support
                break
            case /^feature/.test(current):
                branchColor = branchColors.feature
                break
            case /^fix/.test(current):
                branchColor = branchColors.fix
                break
            default:
                branchColor = branchColors.default
                break
        }

        let useAlternateSeperator = (repoColor.bg == directoryBackground.bg && repoColor.brightBg == directoryBackground.brightBg)
        // let repoSeperatorBg = {
        //     color: useAlternateSeperator ? 'black' : directoryBackground.bg,
        //     bright: useAlternateSeperator ? false : directoryBackground.brightBg,
        // }
        let repoSeperatorBg = { // always use alternate
            color: 'black',
            bright: false,
        }

        let seperatorRepoBlack = color({
            fg: repoColor.bg,
            brightFg: repoColor.brightBg || false,
            bg: repoSeperatorBg.color,
            brightBg: repoSeperatorBg.bright,
        })(seperatorCharacter)

        let seperatorBlackBranch = color({
            fg: repoSeperatorBg.color,
            brightFg: repoSeperatorBg.bright,
            bg: branchColor.bg,
            brightBg: branchColor.brightBg || false,
        })(seperatorCharacter)

        let seperatorBranchDirectory = color({
            fg: branchColor.bg,
            brightFg: branchColor.brightBg || false,
            bg: directoryBackground.bg,
            brightBg: directoryBackground.brightBg || false,
        })(seperatorCharacter)

        let repoShortened = repoContractions[repo] || repo

        branch = color(repoColor)(` \u25cf ${repoShortened} `)
            + seperatorRepoBlack
            + seperatorBlackBranch
            + color(branchColor)(` \ue0a0 ${current} `)
            + seperatorBranchDirectory
    } catch (e) {
        // console.log(e)
        branch = ''
    } finally {
        let seperator = color({
            fg: directoryBackground.bg,
            bg: 'black',
            brightFg: directoryBackground.brightBg || false
        })(seperatorCharacter)
        let prompt = branch + color(directoryBackground)(` ${currentDirectory} `) + seperator + ' ';
        // prompt = prompt.replace(/[^\x00-\x7F ]/g, '%{%G$&}')
        process.stdout.write(prompt)
    }
})()

function color(options) {
    return s => {
        let start = ''
        let end = ''
        if(options.fg) {
            let fgIndex = colors.indexOf(options.fg)
            if(options.brightFg) fgIndex += 8

            start += '%F{' + fgIndex + '}'
            end += '%f'
        }

        if(options.bg) {
            let bgIndex = colors.indexOf(options.bg)
            if(options.brightBg) bgIndex += 8

            start += '%K{' + bgIndex + '}'
            end += '%K'
        }

        if (options.bold) {
            start += '%B'
            end += '%b'
        }

        if (options.underline) {
            start += '%U'
            end += '%u'
        }

        return start + s + end
    }
}