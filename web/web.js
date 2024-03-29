import express from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';

export class WebController {
  /** Express instance */
  #serverApplication
  /** Path of the templates */
  #templatePath = './templates/';
  /** Path of the static files */
  #staticPath = './static/';

  /**
   * Setup the Web server controller
   * @param {Express} serverApplication Express instance
   * @param {string} templatePath Path of the templates
   * @param {string} staticPath Path of the static files
   * @param {number} port Port of the server
   */
  constructor(
    serverApplication,
    templatePath = './web/templates/',
    staticPath = './web/static/'
  ) {
    this.#serverApplication = serverApplication;
    this.#templatePath = templatePath;
    this.#staticPath = staticPath;
  }

  /**
   * Setup the Web server pages and static objects
   */
  initialize() {
    this.#serverApplication.use(
      '/js',
      express.static(path.join(this.#staticPath, 'js'))
    );
    this.#serverApplication.get('/', async (_, response) => {
      response.send(await this.formatPage('index'));
    });
  }

  /**
   * Replace using an async function
   * @param {string} str The string to be parsed and replaced
   * @param {RegExp} regex The regex to apply
   * @param {*} asyncFn The function to be applied
   * @returns the elaborated string
   */
  async replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
      const promise = asyncFn(match, ...args);
      promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
  }

  /**
   * Parse and format a page using JSON templates. The syntax is EXACTLY <!-- t{JSON} -->, where {JSON} is:
   * {
   *    "template": true/false, // A template is placed
   *    "variable": true/false, // A variable is placed
   *    "name": "templateOrVariableName", // Path of the template or name of the variable, should be undefined if is a nested template
   *    "nestedTemplateName": "templateName", // Name of the template passed as argument, if undefined the empty marker remains as is
   *    "nestedTemplates": {"nestedTemplateName":"path"}, // A map of names - paths containing the nested templates to be passed to the template
   *    "variable": {"variableName":"value"}, // A map of names - variables containing the variables to be passed to the template
   * }
   * @param {string} pageName Name of the page to be parsed
   * @param {*} nestedTemplates A map of names - files containing the nested templates to be applied as parameters
   * @param {*} variables A map of names - variables containing the variables to be replaced
   * @returns the formatted page
   */
  async formatPage(pageName, nestedTemplates, variables) {
    try {
      let templateBuffer = await fs.readFile(
        path.join(this.#templatePath, `${pageName}.html`)
      );
      let templateCode = templateBuffer.toLocaleString();
      let templateContent = await this.replaceAsync(
        templateCode,
        /<!-- t({.*?}) -->/gs,
        async (match, jsonString) => {
          try {
            let json = JSON.parse(jsonString);
            if (json.template) {
              let templateName;
              if (json.name !== undefined) templateName = json.name;
              else if (
                nestedTemplates !== undefined &&
                nestedTemplates[json.nestedTemplateName] !== undefined
              )
                templateName = nestedTemplates[json.nestedTemplateName];
              else return match;

              let templateContent = await this.formatPage(
                templateName,
                json.nestedTemplates,
                json.variables
              );
              if (templateContent === null) return match;
              return templateContent;
            } else if (json.variable) {
              return variables[json.name];
            }
          } catch (_) {
            return match;
          }
        }
      );
      return templateContent;
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      else throw err;
    }
  }
}
