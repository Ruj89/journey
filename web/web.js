const express = require('express');
const fs = require('fs/promises');
const path = require('path');

class WebController {
  TEMPLATE_PATH = `${__dirname}/templates/`;
  STATIC_PATH = `${__dirname}/static/`;

  /**
   * Setup the Web server controller
   * @param {serverApplication} serverApplication Express instance
   * @param {number} port Port of the server
   */
  constructor(serverApplication) {
    this.serverApplication = serverApplication;
  }

  /**
   * Setup the Web server pages and static objects
   */
  initialize() {
    this.serverApplication.use(
      '/js',
      express.static(path.join(this.STATIC_PATH, 'js'))
    );
    this.serverApplication.get('/index.html', async (_, response) => {
      response.send(await this.formatPage('index'));
    });
  }

  async replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
      const promise = asyncFn(match, ...args);
      promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
  }

  async formatPage(pageName, nestedTemplates, variables) {
    try {
      let templateBuffer = await fs.readFile(
        path.join(this.TEMPLATE_PATH, `${pageName}.html`)
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

/**
 * Module exports
 */
module.exports = { WebController: WebController };
