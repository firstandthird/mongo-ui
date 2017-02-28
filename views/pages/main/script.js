/* eslint-env browser */

import Domodule from 'domodule';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/matchbrackets';
import CodeMirror from 'codemirror';
import Ajax from 'bequest';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
const textArea = document.getElementById('query'); // eslint-disable-line no-unused-vars


class QueryModule extends Domodule {
  constructor(el) {
    super(el);
    this.singleDB = (window._singleDB) ? window._dbName : false;
    this.setupDbs();
    this.editor = this.setupEditor();
  }

  setupDbs() {
    if (this.singleDB !== false) {
      this.getCollections({ value: this.singleDB });
      return;
    }
    const dbSelect = this.els.databases;
    Ajax.request('/api/databases', 'GET', null, (err, resp) => {
      if (err) {
        alert(err); // eslint-disable-line no-alert
      }

      if (resp.statusCode !== 200) {
        alert('Bad Request Getting Databases'); // eslint-disable-line no-alert
      }

      if (resp.data.length > 0) {
        resp.data.forEach((db) => {
          dbSelect.insertAdjacentHTML('beforeend', `<option value='${db}'>${db}</option>`);
        });
      }
    });
  }

  getCollections(el) {
    const db = el.value;
    const collSelect = this.els.collections;
    collSelect.innerHTML = '<option>Collection</option>';
    collSelect.disabled = true;

    Ajax.request(`/api/databases/${db}/collections`, 'GET', null, (err, resp) => {
      if (err) {
        alert(err); // eslint-disable-line no-alert
      }

      if (resp.statusCode !== 200) {
        alert('Error loading collections'); // eslint-disable-line no-alert
      }

      if (resp.data) {
        resp.data.forEach((coll) => {
          collSelect.insertAdjacentHTML('beforeend', `<option value='${coll}'>${coll}</option>`);
        });
        collSelect.disabled = false;
      }
    });
  }

  setupEditor() {
    const editorEl = this.els.editor;
    const editor = CodeMirror.fromTextArea(editorEl, {
      mode: {
        name: 'javascript',
        json: true
      },
      theme: 'cobalt',
      tabSize: 2,
      indentWithTabs: false,
      matchBrackets: true,
      cursorScrollMargin: 10
    });

    return editor;
  }

  submitQuery() {
    const data = {
      query: this.editor.getValue(),
      db: this.els.databases.value,
      collection: this.els.collections.value
    };

    Ajax.request('/api/query', 'POST', data, (err, resp) => {
      if (err) {
        alert(err); // eslint-disable-line no-alert
      }

      if (resp.data) {
        const respData = JSON.stringify(resp.data, null, 2);
        const html = Prism.highlight(respData, Prism.languages.json);
        this.els.response.innerHTML = `<pre class="language-json">${html}</pre>`;
      }
    });
  }

  submitInsert() {
    const data = {
      data: JSON.parse(this.editor.getValue())
    };

    const db = this.els.databases.value;
    const coll = this.els.collections.value;

    Ajax.request(`/api/databases/${db}/collections/${coll}`, 'POST', data, (err, resp) => {
      if (err) {
        alert(err); // eslint-disable-line no-alert
      }
      console.log(resp); // eslint-disable-line no-console
    });
  }

  doAction(el, event) {
    event.preventDefault();
    const action = this.els.queryAction.value;

    switch (action) {
      case 'find':
        this.submitQuery();
        break;
      case 'insert':
        this.submitInsert();
        break;
      default:
        alert('Action not allowed'); // eslint-disable-line no-alert
    }
  }
}

Domodule.register('QueryModule', QueryModule);
