import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Enhanced markdown to HTML conversion with proper header handling
  const convertMarkdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Process headers in order from most specific to least specific (#### then ### then ## then #)
    html = html.replace(/^#### (.*$)/gm, '<h4 class="text-base font-semibold mt-4 mb-2 text-foreground">$1</h4>');
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-3 text-foreground">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-4 text-foreground">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-6 text-foreground">$1</h1>');

    // Bold text - process before italic to avoid conflicts
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');

    // Italic text - use underscore or single asterisk not captured by bold
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic text-foreground">$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em class="italic text-foreground">$1</em>');

    // Code blocks (backticks) - handle both inline and block code
    html = html.replace(/```([^`]+)```/g, '<pre class="bg-muted p-3 rounded-md text-sm font-mono text-foreground overflow-x-auto mb-4">$1</pre>');
    html = html.replace(/`([^`\n]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">$1</code>');

    // Process lists before line breaks to avoid conflicts
    // Unordered lists with proper nesting support
    html = html.replace(/^[\s]*[-*+]\s+(.*$)/gm, '<li class="ml-4 mb-1 text-foreground list-disc">$1</li>');

    // Ordered lists with proper numbering
    html = html.replace(/^[\s]*\d+\.\s+(.*$)/gm, '<li class="ml-4 mb-1 text-foreground list-decimal">$1</li>');

    // Wrap consecutive list items in ul/ol tags
    html = html.replace(/(<li class="ml-4 mb-1 text-foreground list-disc">.*<\/li>\s*)+/gs, '<ul class="mb-4 pl-4">$&</ul>');
    html = html.replace(/(<li class="ml-4 mb-1 text-foreground list-decimal">.*<\/li>\s*)+/gs, '<ol class="mb-4 pl-4">$&</ol>');

    // Line breaks - convert double newlines to paragraph breaks, single to br
    html = html.replace(/\n\s*\n/g, '</p><p class="mb-4">');
    html = html.replace(/\n/g, '<br>');

    // Wrap the content in paragraph tags
    html = '<p class="mb-4">' + html + '</p>';

    // Clean up empty paragraphs and fix spacing
    html = html.replace(/<p class="mb-4"><\/p>/g, '');
    html = html.replace(/<p class="mb-4">\s*<br>/g, '<p class="mb-4">');
    html = html.replace(/<br>\s*<\/p>/g, '</p>');

    // Fix list formatting within paragraphs
    html = html.replace(/<p class="mb-4">(<[uo]l class="mb-4 pl-4">)/g, '$1');
    html = html.replace(/(<\/[uo]l>)<\/p>/g, '$1');

    return html;
  };

  const htmlContent = convertMarkdownToHtml(content);

  return (
    <div
      className={`prose prose-sm max-w-none text-foreground ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};