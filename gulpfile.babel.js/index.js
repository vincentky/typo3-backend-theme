#!/usr/bin/env node
'use strict';

import { dest, parallel, series, src, watch as gwatch } from 'gulp';
import fs from 'fs';
import notifier from 'gulp-plumber-notifier';
import stylelint from 'gulp-stylelint';
import autoprefixer from 'gulp-autoprefixer';
import sass from 'gulp-sass';
import eslint from 'gulp-eslint';
import image from 'gulp-image';
import ts from 'gulp-typescript';
import yargs from 'yargs';
import fiber from 'fibers';
import sourcemaps from 'gulp-sourcemaps';
import config from './config';

// Recognise `--prod` argument
const argv = yargs.argv;
const production = !!argv.prod;

const themes = fs.readdirSync(config.paths.src.themes);

const capitalize = s => (typeof s !== 'string' ? '' : s.charAt(0).toUpperCase() + s.slice(1));

const themePath = (theme, type) =>
    `${config.paths.src.themes}/${theme}/${capitalize(type)}/**/*${type in config.FILES_EXTENSIONS ?
        '.' + config.FILES_EXTENSIONS[type] : ''}`;

const tsProjects = themes.reduce((acc, theme) => {
    acc[theme] = ts.createProject('./tsconfig.json', {
        declaration: true,
        typeRoots: [themePath(theme, 'types')],
    });
    return acc;
}, {});

const lintTypeScript = theme => {
    src(themePath(theme, 'TypeScript'))
        .pipe(notifier())
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
};

const lintScss = theme => {
    src(themePath(theme, 'scss')).pipe(stylelint(config.stylelint));
};

const optimizeImages = theme => {
    src(themePath(theme, 'Images'))
        .pipe(image())
        .pipe(dest(config.paths.dest.images));
};

const optimizeIcons = theme => {
    src(themePath(theme, 'Icons'))
        .pipe(image())
        .pipe(dest(config.paths.dest.icons));
};

const compileScss = theme => {
    src(themePath(theme, 'scss'))
        .pipe(notifier())
        .pipe(sourcemaps.init())
        .pipe(
            sass({
                fiber: fiber,
                includePaths: config.includePaths,
            }).on('error', sass.logError),
        )
        .pipe(autoprefixer())
        .pipe(sourcemaps.write())
        .pipe(dest(config.paths.dest.css));
};

const compileTypescript = theme => {
    const tsResult = src(themePath(theme, 'TypeScript'))
        .pipe(sourcemaps.init())
        .pipe(tsProjects[theme]());
    tsResult.js.pipe(sourcemaps.write()).pipe(dest(config.paths.dest.js));
};

// Watch Task
export const watch = () => {
    gwatch(
        themes.map(theme => themePath(theme, 'scss')),
        path => {
            return series(compileScss);
        },
    );
    gwatch(
        themes.map(theme => themePath(theme, 'TypeScript')),
        series(compileTypescript),
    );
};

// Development Task
export const dev = parallel(lintTypeScript, lintScss);

const buildThemes = cb => {
    themes.map(theme => {
        compileScss(theme);
        if (theme !== 'Default') {
            lintScss(theme);
            lintTypeScript(theme);
            compileTypescript(theme);
            optimizeImages(theme);
            optimizeIcons(theme);
        }
    });
    cb();
};

// Default task
export default parallel(buildThemes);
