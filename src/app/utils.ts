
export class Utils {
  static formatTextForChart(text: string): string {
    let formatted = '';
    let lineLength = 0;
    text.split(/\W/).forEach(token => {
      formatted += token + ' ';
      lineLength += token.length;
      if (lineLength > 15) {
        formatted += '\n';
        lineLength = 0;
      }
    });
    return formatted;
  }
}
