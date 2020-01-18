#!/usr/bin/env node
'use strict';

import { task, parallel, watch as gwatch, series, src, dest } from 'gulp';
import notifier from 'gulp-plumber-notifier';
import stylelint from 'gulp-stylelint';
import sass from 'gulp-sass';
import babel from 'gulp-babel';
import eslint from 'gulp-eslint';
import image from 'gulp-image';
import ts from 'gulp-typescript';
import yargs from 'yargs';
import fiber from 'fibers';
import sourcemaps from 'gulp-sourcemaps';
import config from './config';

const tsProj = ts.createProject('./tsconfig.json');

// Recognise `--prod` argument
const argv = yargs.argv;
const production = !!argv.prod;

export const lintJs = () =>
    src(config.paths.css.src.map(path => `${path}/**/*.js`))
        .pipe(notifier())
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());

export const lintScss = () =>
    src(config.paths.css.src.map(path => `${path}/**/*.scss`)).pipe(stylelint(config.stylelint));

export const optimizeImages = () =>
    src(config.paths.images.src.map(path => `${path}/**/*`))
        .pipe(image())
        .pipe(dest(config.paths.images.dest));

export const optimizeIcons = () =>
    src(config.paths.icons.src.map(path => `${path}/**/*`))
        .pipe(image())
        .pipe(dest(config.paths.icons.dest));

export const buildStyles = () => {
    series(lintScss);
};
export const compileScss = () =>
    src(config.paths.css.src.map(path => `${path}/**/*.scss`))
        .pipe(notifier())
        .pipe(sourcemaps.init())
        .pipe(
            sass({
                fiber: fiber,
                includePaths: [
                    'Resources/Private/Assets/Scss',
                    'node_modules',
                    'node_modules/bootstrap-sass/assets/stylesheets',
                    'node_modules/font-awesome/scss',
                    'node_modules/eonasdan-bootstrap-datetimepicker/src/sass',
                ],
            }).on('error', sass.logError),
        )
        .pipe(sourcemaps.write())
        .pipe(dest(config.paths.css.dest));

export const compileTypescript = () =>
    src(config.paths.js.src.map(path => `${path}/**/*.ts`))
        .pipe(notifier())
        .pipe(sourcemaps.init())
        .pipe(tsProj())
        .pipe(babel())
        .pipe(sourcemaps.write())
        .pipe(dest(config.paths.js.dest));

// Watch Task
export const watch = () => {
    gwatch(
        config.paths.js.src.map(path => `${path}/**/*.ts`),
        compileTypescript,
    );
    gwatch(
        config.paths.css.src.map(path => `${path}/**/*.scss`),
        compileScss,
    );
};

// Development Task
export const dev = parallel(lintJs, lintScss);

// Default task
export default parallel(compileScss, compileTypescript, optimizeImages, optimizeIcons);
