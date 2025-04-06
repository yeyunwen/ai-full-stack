import React from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import "github-markdown-css/github-markdown-light.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Markdown渲染组件
 * 使用marked解析markdown内容并使用DOMPurify防止XSS攻击
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  // 配置marked选项
  marked.setOptions({
    gfm: true, // 启用GitHub风格Markdown
    breaks: true, // 允许回车换行
  });

  // 解析markdown并清理HTML以防XSS攻击
  const getMarkdownHtml = () => {
    const rawHtml = marked.parse(content) as string;
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    return { __html: cleanHtml };
  };

  return (
    <div
      className={`markdown-body text-sm ${className}`}
      dangerouslySetInnerHTML={getMarkdownHtml()}
    />
  );
};

export default MarkdownRenderer;
