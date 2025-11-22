
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const renderLine = (line: string) => {
    // Bold text: **text**
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-slate-100">$1</strong>');
    return <span dangerouslySetInnerHTML={{ __html: line }} />;
  };

  const lines = content.split('\n');
  const elements = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-300 mb-4">
          {listItems.map((item, index) => (
            <li key={index} className="leading-relaxed">{renderLine(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    line = line.trim();
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-lg font-bold mt-6 mb-3 text-primary-700 dark:text-primary-400 uppercase tracking-wide text-sm">
          {renderLine(line.substring(4))}
        </h3>
      );
    } else if (line.startsWith('* ')) {
      listItems.push(line.substring(2));
    } else if (line) {
      flushList();
      elements.push(
        <p key={index} className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
          {renderLine(line)}
        </p>
      );
    }
  });

  flushList(); // Add any remaining list items

  return <div className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base">{elements}</div>;
};

export default MarkdownRenderer;
