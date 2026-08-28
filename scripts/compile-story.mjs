import fs from 'node:fs';
import { Compiler } from 'inkjs/full';

const source = fs.readFileSync(new URL('../src/narrative/case.ink', import.meta.url), 'utf8');
const story = new Compiler(source).Compile();
fs.writeFileSync(new URL('../src/narrative/case.compiled.json', import.meta.url), story.ToJson());
