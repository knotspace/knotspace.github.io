import { createElement as el, createRoot, useEffect, useRef, useState } from '@wordpress/element';
import { registerBlockType, getBlockType, createBlock } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import {
  BlockEditorProvider, BlockList, BlockTools, Inserter, WritingFlow, ObserveTyping, DropZoneProvider,
  BlockEditorKeyboardShortcuts, useBlockProps, RichText
} from '@wordpress/block-editor';
import { SlotFillProvider, Popover, SelectControl } from '@wordpress/components';

import '@wordpress/components/build-style/style.css';
import '@wordpress/block-editor/build-style/style.css';
import '@wordpress/block-library/build-style/style.css';
import '@wordpress/block-library/build-style/editor.css';
import '@wordpress/block-library/build-style/theme.css';
import './gutenberg-editor.css';

registerCoreBlocks();

if (!getBlockType('knot/callout')) {
  registerBlockType('knot/callout', {
    apiVersion: 3,
    title: 'ポイント枠',
    description: '補足・注意・まとめなどを目立たせます。',
    icon: 'info',
    category: 'text',
    attributes: {
      title: { type: 'string', default: 'ポイント' },
      text: { type: 'string', default: '' },
      style: { type: 'string', default: 'note' }
    },
    edit: ({ attributes, setAttributes }) => el('aside',
      useBlockProps({ className: 'knot-gutenberg-callout knot-gutenberg-callout-' + (attributes.style || 'note') }),
      el(RichText, { tagName: 'strong', value: attributes.title, placeholder: '枠の見出し', allowedFormats: ['core/bold'], onChange: title => setAttributes({ title }) }),
      el(RichText, { tagName: 'p', value: attributes.text, placeholder: '説明を入力…', onChange: text => setAttributes({ text }) }),
      el(SelectControl, { label: 'デザイン', value: attributes.style || 'note', options: [
        { label: '補足', value: 'note' }, { label: 'ポイント', value: 'point' },
        { label: '注意', value: 'warning' }, { label: 'まとめ', value: 'summary' }
      ], onChange: style => setAttributes({ style }) })
    ),
    save: () => null
  });
}

if (!getBlockType('knot/button')) {
  registerBlockType('knot/button', {
    apiVersion: 3,
    title: 'リンクボタン',
    description: '記事内にリンクボタンを配置します。',
    icon: 'admin-links',
    category: 'text',
    attributes: {
      label: { type: 'string', default: '詳しく見る' },
      url: { type: 'string', default: '' }
    },
    edit: ({ attributes, setAttributes }) => el('div',
      useBlockProps({ className: 'knot-gutenberg-button-block' }),
      el(RichText, { tagName: 'span', value: attributes.label, placeholder: 'ボタンの文字', onChange: label => setAttributes({ label }) }),
      el('label', { className: 'knot-gutenberg-url-label' }, 'リンク先URL',
        el('input', { type: 'url', value: attributes.url || '', placeholder: 'https://… または /page/', onChange: event => setAttributes({ url: event.target.value }) })
      ),
      el('div', { className: 'knot-gutenberg-button-preview' }, attributes.label || 'リンクボタン')
    ),
    save: () => null
  });
}

function asArray(value) {
  if (value && typeof value.toJS === 'function') value = value.toJS();
  return Array.isArray(value) ? value.map(item => item && typeof item.toJS === 'function' ? item.toJS() : item).filter(Boolean) : [];
}

function legacyToBlocks(value) {
  return asArray(value).map(item => {
    if (item.name && item.attributes) {
      return createBlock(item.name, item.attributes || {}, Array.isArray(item.innerBlocks) ? legacyToBlocks(item.innerBlocks) : []);
    }
    const type = item.type || item.blockType || 'paragraph';
    if (type === 'heading') return createBlock('core/heading', { level: Number(item.level) === 3 ? 3 : 2, content: item.text || '' });
    if (type === 'image') return createBlock('core/image', { url: item.src || item.image || '', alt: item.alt || '', caption: item.caption || '' });
    if (type === 'quote') return createBlock('core/quote', { value: item.text || '', citation: item.attribution || '' });
    if (type === 'list') {
      const items = String(item.items || '').split('\n').map(text => text.trim()).filter(Boolean);
      return createBlock('core/list', { ordered: !!item.ordered }, items.map(content => createBlock('core/list-item', { content })));
    }
    if (type === 'divider') return createBlock('core/separator');
    if (type === 'callout') return createBlock('knot/callout', { title: item.title || 'ポイント', text: item.text || '', style: item.style || 'note' });
    if (type === 'button') return createBlock('knot/button', { label: item.label || '詳しく見る', url: item.url || '' });
    return createBlock('core/paragraph', { content: item.text || '' });
  });
}

function blocksToLegacy(blocks) {
  return blocks.map(block => {
    const a = block.attributes || {};
    if (block.name === 'core/paragraph') return { type: 'paragraph', text: a.content || '' };
    if (block.name === 'core/heading') return { type: 'heading', level: a.level || 2, text: a.content || '' };
    if (block.name === 'core/image') return { type: 'image', src: a.url || '', alt: a.alt || '', caption: a.caption || '' };
    if (block.name === 'core/quote') return { type: 'quote', text: a.value || '', attribution: a.citation || '' };
    if (block.name === 'core/list') return {
      type: 'list',
      ordered: !!a.ordered,
      items: (block.innerBlocks || []).map(child => child.attributes && child.attributes.content || '').join('\n')
    };
    if (block.name === 'core/separator') return { type: 'divider' };
    if (block.name === 'knot/callout') return { type: 'callout', title: a.title || 'ポイント', text: a.text || '', style: a.style || 'note' };
    if (block.name === 'knot/button') return { type: 'button', label: a.label || '詳しく見る', url: a.url || '' };
    return { type: 'paragraph', text: a.content || '' };
  });
}

function Editor({ value, onChange }) {
  const [blocks, setBlocks] = useState(() => legacyToBlocks(value));
  const lastEmitted = useRef('');
  const lastIncoming = useRef(JSON.stringify(asArray(value)));

  useEffect(() => {
    const incoming = JSON.stringify(asArray(value));
    if (incoming !== lastIncoming.current && incoming !== lastEmitted.current) {
      lastIncoming.current = incoming;
      setBlocks(legacyToBlocks(value));
    }
  }, [value]);

  const update = next => {
    setBlocks(next);
    const legacy = blocksToLegacy(next);
    lastEmitted.current = JSON.stringify(legacy);
    lastIncoming.current = lastEmitted.current;
    onChange(legacy);
  };

  return el(SlotFillProvider, null,
    el(DropZoneProvider, null,
    el(BlockEditorProvider, {
      value: blocks,
      onInput: update,
      onChange: update,
      settings: { allowedBlockTypes: ['core/paragraph', 'core/heading', 'core/image', 'core/quote', 'core/list', 'core/separator', 'knot/callout', 'knot/button'] }
    },
      el('div', { className: 'knot-gutenberg-editor' },
        el('div', { className: 'knot-gutenberg-topbar' },
          el('strong', null, 'ブロックエディター'),
          el('span', null, 'クリックして直接編集・ブロックを追加'),
          el(Inserter, { position: 'bottom right' })
        ),
        el(BlockEditorKeyboardShortcuts, null),
        el(BlockTools, null,
          el(WritingFlow, null,
            el(ObserveTyping, null,
              el(BlockList, null)
            )
          )
        ),
        el('div', { className: 'knot-gutenberg-bottom-inserter' }, el(Inserter, { position: 'bottom right' })),
        el(Popover.Slot, null)
      )
    )
  ));
}

const roots = new WeakMap();
function mount(node, value, onChange) {
  const root = createRoot(node);
  roots.set(node, root);
  root.render(el(Editor, { value, onChange }));
  return root;
}
function update(node, value, onChange) {
  const root = roots.get(node);
  if (root) root.render(el(Editor, { value, onChange }));
}
function unmount(node) {
  const root = roots.get(node);
  if (root) root.unmount();
  roots.delete(node);
}

window.KnotGutenberg = { mount, update, unmount };
