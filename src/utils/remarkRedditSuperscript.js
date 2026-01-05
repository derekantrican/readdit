// Custom remark plugin to handle Reddit-style superscripts
// Reddit uses ^text or ^(text with spaces) where each consecutive ^ increases nesting level
// This plugin transforms these into proper <sup> HTML tags

import { visit } from 'unist-util-visit';

function remarkRedditSuperscript() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!node.value || !node.value.includes('^')) {
        return;
      }

      const newNodes = [];
      let remaining = node.value;
      let lastIndex = 0;

      // Regex to match Reddit superscript patterns: one or more ^ followed by word or (text)
      const regex = /(\^+)(\([^)]+\)|[^\s^]+)/g;
      let match;

      while ((match = regex.exec(remaining)) !== null) {
        // Add any text before the match
        if (match.index > lastIndex) {
          newNodes.push({
            type: 'text',
            value: remaining.substring(lastIndex, match.index)
          });
        }

        const caretCount = match[1].length; // Number of ^ characters
        let content = match[2];
        
        // Extract the superscript content (remove parentheses if present)
        if (content.startsWith('(') && content.endsWith(')')) {
          content = content.slice(1, -1);
        }

        // Create nested superscript HTML tags based on caret count
        let html = content;
        for (let i = 0; i < caretCount; i++) {
          html = `<sup>${html}</sup>`;
        }

        newNodes.push({
          type: 'html',
          value: html
        });

        lastIndex = match.index + match[0].length;
      }

      // Add any remaining text
      if (lastIndex < remaining.length) {
        newNodes.push({
          type: 'text',
          value: remaining.substring(lastIndex)
        });
      }

      // If we made changes, replace the node
      if (newNodes.length > 0) {
        parent.children.splice(index, 1, ...newNodes);
        return index + newNodes.length;
      }
    });
  };
}

export default remarkRedditSuperscript;
