const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(target);
    return target.endsWith('.js') ? [target] : [];
  });
}
const dirs = ["src", "scripts", "tests"];
let checked = 0;
for (const dir of dirs) {
  for (const file of files(path.join(__dirname, '..', dir))) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) {
      console.error(`ERRO: ${file}\n${result.stderr}`);
      process.exitCode = 1;
    }
    checked++;
  }
}
if (!process.exitCode) console.log(`Sintaxe verificada em ${checked} arquivos JavaScript.`);
