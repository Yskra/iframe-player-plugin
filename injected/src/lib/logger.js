/* eslint-disable no-console */

const baseStyle = 'color: #383A58; font-size: 10px; padding: 4px; font-weight: 700;';
const prefixStyle = `${baseStyle}`;

const COLOR = Object.freeze({
  INFO: '#00B4FF',
  WARN: '#FFBD00',
  ERROR: '#FF5760',
});

export class Logger {
  _prefix = { text: '', color: '' };

  constructor(name) {
    this._prefix = { text: name, color: '#009a0d' };
  }

  _getBadge() {
    return [
      `%c${this._prefix.text}`,
      `background: ${this._prefix.color}; ${prefixStyle}`,
    ];
  }

  /**
   * @param {...any} message
   */
  info(...message) {
    console.info(...this._getBadge(COLOR.INFO), ...message);
  }

  /**
   * @param {...any} message
   */
  warn(...message) {
    console.warn(...this._getBadge(COLOR.WARN), ...message);
  }

  /**
   * @param {...any} message
   */
  error(...message) {
    console.error(...this._getBadge(COLOR.ERROR), ...message);
  }
}

export default new Logger('Video iframe API');
