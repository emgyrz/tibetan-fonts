#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import  url from 'url'

import {readFonts} from './readFonts.js'
import {getTplParts} from './tpl.js'


const repoUrl = 'https://github.com/OpenPecha/tibetan-fonts/'
const repoTree = repoUrl + 'tree/main/'

const CURRENT_DIR = (() => {
    if (import.meta.url.startsWith('file:')) {
        const modulePath = url.fileURLToPath(import.meta.url);
        return path.resolve(path.dirname(modulePath))
    }
    throw new Error('can`t get dir of script. did you run script locally?')
})();
const ROOT_DIR = path.dirname(CURRENT_DIR)



const dirToWalk = [
    'Unicode Font Families & Typefaces',
    'Unicode Individual fonts',
    'Variable Fonts',
    'Unicode Problematic:Outdated:ReExported:Incomplete fonts'
]

const MAIN_TEXT = '༄༅། །སངས་རྒྱས་ཆོས་དང་ཚོགས་ཀྱི་མཆོག་རྣམས་ལ། །བྱང་ཆུབ་བར་དུ་བདག་ནི་སྐྱབས་སུ་མཆི། །བདག་གྱིས་སྤྱིན་སོགས་བགྱིས་པའི་བསོད་ནམས་ཀྱིས། །འགྲོ་ལ་ཕན་ཕྱིར་སངས་རྒྱས་འགྲུབ་པར་ཤོག ༈'

async function run() {
    const TPL = (await fs.promises.readFile(path.join(CURRENT_DIR, 'tpl.html'))).toString()
    const fonts = await readFonts(ROOT_DIR, dirToWalk)

    const tplParts = getTplParts(TPL)

    const fontFacesStr = fonts.flat.map(f => f.fontFace).join('')
    
    const dirsStr = fonts.dirs.map(dir => {
        return tplParts.acc.render({
            '@@TITLE': dir,
            '@@SRC': repoTree + encodeURIComponent(dir),
            '@@CONTENT': fonts.byDir[dir].map(f => {
                return tplParts.paragraph.render({
                    '@@STYLE': f.cssStyle,
                    '@@NAME': f.name,
                    '@@TEXT': MAIN_TEXT,
                })
            }).join('\n'),
        })
    }).join('\n')
    
    const resultTpl = tplParts.root.render({
        '@@FONTFACES': fontFacesStr,
        '@@PARAGRAPHS': dirsStr,
        '@@REPO': repoUrl,
        '@@MAIN_TEXT': MAIN_TEXT,
    })
        
    const generatedFileName = path.join(ROOT_DIR, 'index.html')
    await fs.promises.writeFile(
        generatedFileName, 
        getDateComment() + resultTpl
    )

    console.info('File is generated:', generatedFileName)
}

run()


function getDateComment() {
    const scriptName = path.relative(path.dirname(ROOT_DIR), CURRENT_DIR)
    return `<!-- Generated at ${new Date().toLocaleString()} by ${scriptName} -->\n`
}
