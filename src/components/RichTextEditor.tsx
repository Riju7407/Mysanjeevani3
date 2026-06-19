'use client';

import React, { useMemo, useEffect, useState, useRef, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  theme?: 'snow' | 'bubble';
}

// Polyfill findDOMNode to prevent React 19 errors
if (typeof window !== 'undefined' && !require('react-dom').findDOMNode) {
  const ReactDOM = require('react-dom');
  ReactDOM.findDOMNode = function(component: any) {
    if (component && component.current) return component.current;
    if (component && component.getDOMNode) return component.getDOMNode();
    return component;
  };
}

// Dynamically import ReactQuill with no SSR
const ReactQuillBase = dynamic(
  () => import('react-quill').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="ql-container ql-snow" style={{ minHeight: '200px' }}>
        <div className="ql-editor" style={{ minHeight: '200px', padding: '12px', color: '#9ca3af' }}>
          Loading editor...
        </div>
      </div>
    ),
  }
);

// Wrap ReactQuill with forwardRef to handle ref properly
const ReactQuill = forwardRef((props: any, ref) => (
  <ReactQuillBase {...props} ref={ref} />
));

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  readOnly = false,
  theme = 'snow',
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: readOnly
        ? false
        : [
            // Text formatting
            ['bold', 'italic', 'underline', 'strike'],
            // Colors
            [{ color: [] }, { background: [] }],
            // Font size
            [{ size: ['small', false, 'large', 'huge'] }],
            // Lists
            [{ list: 'ordered' }, { list: 'bullet' }],
            // Align
            [{ align: [] }],
            // Clear formatting
            ['clean'],
          ],
    }),
    [readOnly]
  );

  const formats = [
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'size',
    'list',
    'bullet',
    'align',
  ];

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="rich-text-editor">
        <div className="ql-container ql-snow" style={{ minHeight: '200px' }}>
          <div className="ql-editor" style={{ minHeight: '200px', padding: '12px', color: '#9ca3af' }}>
            {placeholder}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rich-text-editor">
      <style>{`
        .ql-container.ql-snow {
          border: 1px solid #d1d5db;
          border-top: none;
          min-height: 200px;
          font-size: 14px;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          background-color: #ffffff;
        }
        
        .ql-editor {
          min-height: 200px;
          padding: 12px;
          font-family: inherit;
          color: #1f2937;
        }

        .ql-editor.ql-blank::before {
          color: #6b7280;
          font-style: italic;
        }

        .ql-toolbar.ql-snow {
          border: 1px solid #d1d5db;
          border-bottom: none;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background-color: #f3f4f6;
        }

        .ql-toolbar.ql-snow .ql-stroke {
          stroke: #1f2937;
        }

        .ql-toolbar.ql-snow .ql-fill {
          fill: #1f2937;
        }

        .ql-toolbar.ql-snow .ql-picker-label {
          color: #1f2937;
        }

        .ql-toolbar.ql-snow button:hover .ql-stroke,
        .ql-toolbar.ql-snow button.ql-active .ql-stroke,
        .ql-toolbar.ql-snow .ql-picker-label:hover,
        .ql-toolbar.ql-snow .ql-picker-item:hover .ql-selected .ql-stroke {
          stroke: #059669;
        }

        .ql-toolbar.ql-snow button:hover .ql-fill,
        .ql-toolbar.ql-snow button.ql-active .ql-fill,
        .ql-toolbar.ql-snow .ql-picker-label:hover,
        .ql-toolbar.ql-snow .ql-picker-item:hover .ql-selected .ql-fill,
        .ql-toolbar.ql-snow .ql-picker-item:hover .ql-stroke .ql-fill {
          fill: #059669;
        }

        .ql-snow.ql-toolbar button.ql-active .ql-picker-label {
          color: #059669;
        }

        .ql-toolbar.ql-snow button {
          background-color: transparent;
        }

        .ql-toolbar.ql-snow button:hover {
          background-color: #e5e7eb;
          border-radius: 4px;
        }

        .ql-toolbar.ql-snow button.ql-active {
          background-color: #d1d5db;
          border-radius: 4px;
        }

        .ql-snow .ql-tooltip {
          background-color: #1f2937;
          padding: 5px 12px;
          border-radius: 4px;
          color: white;
          font-size: 12px;
        }
      `}</style>
      <ReactQuill
        ref={editorRef}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        theme={theme}
        readOnly={readOnly}
        placeholder={placeholder}
      />
    </div>
  );
}
