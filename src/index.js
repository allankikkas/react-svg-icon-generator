const nunjucks = require('nunjucks');
const path = require('path');
const fs = require('fs');

const getSvsgInDir = require('./helpers/getSvgsInDir');
const minifySvg = require('./helpers/minifySvg');
const { cleanupName, cleanupSvg } = require('./helpers/cleanup');

nunjucks.configure({ autoescape: false });

const defaultTemplate = path.join(__dirname, '..', 'template', 'icon.nunjucks');
const defaultComment = 'Generated by gulp icon - do not modify manually';

module.exports = (config) => {
    const template = config.template || defaultTemplate;
    const templateFile = path.isAbsolute(template) ? template : path.join(process.cwd(), template);
    const templateContent = fs.readFileSync(templateFile).toString();
    const svgDir = path.isAbsolute(config.svgDir) ? config.svgDir : path.join(process.cwd(), config.svgDir);

    console.log('Looking for SVG Icons in:', svgDir); // eslint-disable-line no-console
    console.log('Using Icon template from:', templateFile); // eslint-disable-line no-console

    const svgs = getSvsgInDir(svgDir);
    const iconDestination = config.destination || path.join(process.cwd(), 'Icon.react.js');
    const comment = config.comment || defaultComment;
    const svgPromises = svgs.map(file => minifySvg(file, fs.readFileSync(file).toString()));

    return Promise.all(svgPromises)
        .then((results) => {
            const icons = results.map(result => ({
                name: cleanupName(result.name),
                svg: cleanupSvg(result.svg.data)
            })).sort((a, b) => a.name.localeCompare(b.name));
            fs.writeFileSync(iconDestination, nunjucks.renderString(templateContent, { icons, comment }));
            console.log('Generated SVG Icon component to:', iconDestination); // eslint-disable-line no-console
            console.log(icons.map(icon => `<Icon kind="${icon.name}" />`).join('\n')); // eslint-disable-line no-console
        })
        .catch(error => console.error(error)); // eslint-disable-line no-console
};
