#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { registerCommands } from '../index.js';

const parser = yargs(hideBin(process.argv));
registerCommands(parser);
parser.parse();
