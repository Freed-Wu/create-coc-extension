import chalk from 'chalk';
import * as glob from 'fast-glob';
import * as fs from 'fs';
import { dirname, join, resolve } from 'path';
import { promisify } from 'util';
import * as yargs from 'yargs';
import { questions } from './questions';

const read = promisify(fs.readFile);
const write = promisify(fs.writeFile);

const template = join(__dirname, '..', 'template');

export async function scaffold(argv: yargs.Argv): Promise<void> {
  const dest = resolve(argv['path']);
  await fs.mkdirSync(dest, { recursive: true });

  const answers = await questions(dest);

  const stream = glob.stream('**/*', { cwd: template, dot: true });
  stream.on('data', async file => {
    const dir = dirname(file);

    if (dir !== '.') {
      await fs.mkdirSync(join(dest, dir), { recursive: true });
    }

    let content = await read(join(template, file), 'utf8');

    // replace each template key
    Object.entries(answers).forEach(([key, value]) => {
      content = content.replace(new RegExp(`\\[${key}\\]`, 'g'), <string>value);
    });

    // write file to destination
    await write(join(dest, file), content);
  });

  const cmd = `cd ${dest} && yarn`;
  const vimcmd = `"set runtimepath^=${dest}"`;
  const cocmsg = `"[coc.nvim] ${answers.title} is works!"`;

  console.log(`
${answers.title} is created.

  ${chalk.green(cmd)}

then ${chalk.green(vimcmd)} in vimrc/init.vim, open vim and you will see ${chalk.green(cocmsg)} in vim messages.
`);
}