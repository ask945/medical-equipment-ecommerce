import React, { useRef, useState, useEffect, useMemo } from 'react';
import JoditEditor from 'jodit-react';

const RichTextEditor = ({ value, onChange, placeholder = '', maxLength = 10000, maxImageSizeInMB = 3.50 }) => {
    const editorRef = useRef(null);
    const [imageSize, setImageSize] = useState(0);
    const [characterCount, setCharacterCount] = useState(0);

    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .jodit-wysiwyg ul {
                list-style-type: disc !important;
                margin-left: 20px !important;
                padding-left: 20px !important;
            }
            .jodit-wysiwyg ol {
                list-style-type: decimal !important;
                margin-left: 20px !important;
                padding-left: 20px !important;
            }
            .jodit-wysiwyg li {
                display: list-item !important;
                margin-bottom: 5px !important;
            }
            .jodit-wysiwyg ul li {
                list-style-type: disc !important;
            }
            .jodit-wysiwyg ol li {
                list-style-type: decimal !important;
            }
            .jodit-toolbar-button__ul .jodit-toolbar-button__trigger,
            .jodit-toolbar-button__ol .jodit-toolbar-button__trigger {
                display: none !important;
            }
            .jodit-wysiwyg a {
                color: #1e40af !important;
                text-decoration: underline !important;
                cursor: pointer !important;
            }
            .jodit-wysiwyg a:hover {
                color: #1d4ed8 !important;
            }
            .jodit-wysiwyg a:visited {
                color: #7c3aed !important;
            }
            .jodit-wysiwyg h1 { font-size: 1.875rem !important; font-weight: 700 !important; margin: 0.5em 0; }
            .jodit-wysiwyg h2 { font-size: 1.5rem !important; font-weight: 600 !important; margin: 0.5em 0; }
            .jodit-wysiwyg h3 { font-size: 1.25rem !important; font-weight: 600 !important; margin: 0.5em 0; }
            .jodit-wysiwyg h4 { font-size: 1.125rem !important; font-weight: 500 !important; margin: 0.5em 0; }
            .jodit-wysiwyg pre,
            .jodit-wysiwyg code {
                color: #16a34a !important;
                background-color: #f9fafb !important;
                font-family: monospace !important;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                display: block;
                overflow-x: auto;
            }
            .jodit-wysiwyg blockquote {
                border-left: 4px solid #9ca3af;
                padding-left: 1rem;
                margin: 1rem 0;
                color: #1f2937;
                font-style: italic;
                background-color: #e5e7eb;
                border-radius: 0.25rem;
            }
            .jodit-dialog {
                z-index: 10000 !important;
                position: fixed !important;
            }
            .jodit-dialog__overlay {
                z-index: 9999 !important;
            }
            .jodit-dialog__content {
                z-index: 10001 !important;
            }
        `;
        document.head.appendChild(style);
        return () => {
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
    }, []);

    const config = useMemo(() => ({
        readonly: false,
        height: 400,
        toolbar: true,
        spellcheck: true,
        language: 'en',
        toolbarButtonSize: 'small',
        toolbarAdaptive: false,
        showCharsCounter: false,
        showWordsCounter: false,
        showXPathInStatusbar: false,
        askBeforePasteHTML: false,
        askBeforePasteFromWord: false,
        defaultActionOnPaste: 'insert_clear_html',
        globalFullSize: false,
        saveSelectionOnBlur: true,
        buttons: [
            'source', '|',
            'bold', 'italic', 'underline', 'paragraph', '|',
            'ul', 'ol', '|',
            'outdent', 'indent', '|',
            'brush', '|',
            'image', 'table', 'link', '|',
            'align', 'undo', 'redo', '|',
            'hr', 'eraser',
            'fullsize',
        ],
        uploader: {
            insertImageAsBase64URI: true,
            imagesExtensions: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
            withCredentials: false,
            format: 'json',
            method: 'POST',
        },
        removeButtons: ['brush', 'file'],
        showPlaceholder: false,
        placeholder: placeholder,
        controls: {
            ul: {
                command: 'insertUnorderedList',
                tags: ['ul'],
                tooltip: 'Insert Unordered List',
                list: false
            },
            ol: {
                command: 'insertOrderedList',
                tags: ['ol'],
                tooltip: 'Insert Ordered List',
                list: false
            }
        },
        style: {
            'ul': 'list-style-type: disc !important; margin-left: 20px !important; padding-left: 20px !important;',
            'ol': 'list-style-type: decimal !important; margin-left: 20px !important; padding-left: 20px !important;',
            'li': 'margin-bottom: 5px !important; display: list-item !important;'
        },
        events: {
            afterInit: (editor) => {
                let storedSelection = null;

                editor.events.on('beforeOpenDialog', () => {
                    if (editor.selection && editor.selection.current()) {
                        storedSelection = editor.selection.save();
                    }
                });

                editor.events.on('afterCloseDialog', () => {
                    if (storedSelection && editor.selection) {
                        setTimeout(() => {
                            try {
                                editor.selection.restore(storedSelection);
                                editor.focus();
                            } catch (e) { /* ignore */ }
                        });
                    }
                });

            },
        }
    }), [placeholder]);

    const calculateImageSizes = (content) => {
        if (!content) return 0;
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const images = doc.querySelectorAll('img[src^="data:image"]');
        let totalSize = 0;
        images.forEach(img => {
            const base64Data = img.src.split(',')[1];
            if (base64Data) totalSize += (base64Data.length * 0.75);
        });
        return totalSize;
    };

    const countCharacters = (content) => {
        if (!content) return 0;
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const countTextNodes = (node) => {
            let count = 0;
            if (node.nodeType === Node.TEXT_NODE) return node.textContent.length;
            if (node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'SCRIPT' || node.tagName === 'STYLE')) return 0;
            if (node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'P' || node.tagName === 'TD')) {
                count += node.querySelectorAll('br').length;
            }
            if (node.childNodes && node.childNodes.length > 0) {
                node.childNodes.forEach(child => { count += countTextNodes(child); });
            }
            return count;
        };
        if (doc.body.innerHTML === "<p><br></p>") return 0;
        return countTextNodes(doc.body);
    };

    const handleEditorBlur = (newContent) => {
        onChange(newContent);
    };

    useEffect(() => {
        if (value) {
            setCharacterCount(countCharacters(value));
            setImageSize(calculateImageSizes(value));
        } else {
            setCharacterCount(0);
            setImageSize(0);
        }
    }, [value]);

    return (
        <div className="rich-text-editor">
            <JoditEditor
                ref={editorRef}
                value={value}
                config={config}
                tabIndex={1}
                onBlur={handleEditorBlur}
            />
            <div className="mt-2 space-y-1">
                <p className="text-gray-500 text-xs">
                    Supports rich formatting, copy-paste from Docs, bullet points, and tables.
                </p>
                <div className="flex justify-between items-center">
                    <p className={`text-xs ${characterCount > maxLength ? 'text-red-500' : 'text-gray-500'}`}>
                        Characters: {characterCount}/{maxLength}
                    </p>
                    {imageSize >= 0.01 * 1024 * 1024 && (
                        <p className={`text-xs ${imageSize > maxImageSizeInMB * 1024 * 1024 ? 'text-red-500' : 'text-gray-500'}`}>
                            Images: {(imageSize / (1024 * 1024)).toFixed(2)} MB / {maxImageSizeInMB} MB
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RichTextEditor;
