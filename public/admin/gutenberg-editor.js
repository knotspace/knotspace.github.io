import { createElement as el, createRoot, useEffect, useRef, useState } from '@wordpress/element';
import { registerBlockType, getBlockType, createBlock, parse, serialize } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import {
  BlockEditorProvider, BlockList, BlockTools, BlockInspector, Inserter, WritingFlow, ObserveTyping,
  BlockEditorKeyboardShortcuts, useBlockProps, RichText
} from '@wordpress/block-editor';
import { SlotFillProvider, DropZoneProvider, Popover, SelectControl } from '@wordpress/components';
import { setLocaleData } from '@wordpress/i18n';

// Gutenberg core labels used by KNOT's editor.
setLocaleData({
  'Add block': ['ブロックを追加'], 'Search': ['検索'], 'Search for a block': ['ブロックを検索'],
  'Paragraph': ['段落'], 'Heading': ['見出し'], 'Image': ['画像'], 'Quote': ['引用'],
  'List': ['リスト'], 'Bulleted list': ['箇条書き'], 'Numbered list': ['番号付きリスト'],
  'Separator': ['区切り'], 'Text': ['テキスト'], 'Media': ['メディア'], 'Design': ['デザイン'],
  'Move up': ['上へ移動'], 'Move down': ['下へ移動'], 'Remove block': ['ブロックを削除'],
  'Duplicate': ['複製'], 'More options': ['その他のオプション'], 'Block settings': ['ブロック設定'],
  'Write paragraph…': ['文章を入力…'], 'Add title': ['タイトルを追加'],
}, 'default');
setLocaleData({ 'Paragraph': ['段落'], 'Heading': ['見出し'], 'Image': ['画像'], 'Quote': ['引用'], 'List': ['リスト'], 'Separator': ['区切り'] }, 'core');

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


if (!getBlockType('knot/code')) {
  registerBlockType('knot/code', {
    apiVersion: 3, title: 'コード', description: 'プログラムやコマンドを見やすく表示します。',
    icon: 'editor-code', category: 'text',
    attributes: { code: { type: 'string', default: '' }, language: { type: 'string', default: 'text' } },
    edit: ({ attributes, setAttributes }) => el('div', useBlockProps({ className: 'knot-code-block' }),
      el(SelectControl, { label: '言語', value: attributes.language || 'text', options: ['text','javascript','typescript','html','css','bash','python','json'].map(value => ({ label: value, value })), onChange: language => setAttributes({ language }) }),
      el('textarea', { className: 'knot-code-input', value: attributes.code || '', placeholder: 'コードを入力…', rows: 7, spellCheck: false, onChange: event => setAttributes({ code: event.target.value }) })
    ), save: () => null
  });
}
if (!getBlockType('knot/accordion')) {
  registerBlockType('knot/accordion', {
    apiVersion: 3, title: '折りたたみ', description: 'クリックで開閉できる補足情報を追加します。',
    icon: 'arrow-down-alt2', category: 'design',
    attributes: { title: { type: 'string', default: '詳しく見る' }, text: { type: 'string', default: '' } },
    edit: ({ attributes, setAttributes }) => el('div', useBlockProps({ className: 'knot-accordion-editor' }),
      el(RichText, { tagName: 'strong', value: attributes.title, placeholder: '見出し', onChange: title => setAttributes({ title }) }),
      el(RichText, { tagName: 'p', value: attributes.text, placeholder: '開いたときに表示する内容', onChange: text => setAttributes({ text }) })
    ), save: () => null
  });
}
if (!getBlockType('knot/notice')) {
  registerBlockType('knot/notice', {
    apiVersion: 3, title: 'お知らせ・注意', description: '重要なお知らせや注意点を強調します。',
    icon: 'megaphone', category: 'design',
    attributes: { title: { type: 'string', default: 'お知らせ' }, text: { type: 'string', default: '' }, tone: { type: 'string', default: 'info' } },
    edit: ({ attributes, setAttributes }) => el('aside', useBlockProps({ className: 'knot-notice-editor knot-notice-' + (attributes.tone || 'info') }),
      el(RichText, { tagName: 'strong', value: attributes.title, placeholder: '見出し', onChange: title => setAttributes({ title }) }),
      el(RichText, { tagName: 'p', value: attributes.text, placeholder: '内容を入力…', onChange: text => setAttributes({ text }) }),
      el(SelectControl, { label: '種類', value: attributes.tone || 'info', options: [{label:'お知らせ',value:'info'},{label:'成功',value:'success'},{label:'注意',value:'warning'}], onChange: tone => setAttributes({ tone }) })
    ), save: () => null
  });
}

function asArray(value) {
  if (value && typeof value.toJS === 'function') value = value.toJS();
  return Array.isArray(value) ? value.map(item => item && typeof item.toJS === 'function' ? item.toJS() : item).filter(Boolean) : [];
}

function legacyToBlocks(value) {
  return asArray(value).flatMap(item => {
    if (item.type === 'wordpress' && typeof item.html === 'string') return parse(item.html);
    if (item.type === 'wordpress-block' && item.name) return [createBlock(item.name, item.attributes || {}, Array.isArray(item.innerBlocks) ? legacyToBlocks(item.innerBlocks) : [])];
    if (item.name && item.attributes) {
      return [createBlock(item.name, item.attributes || {}, Array.isArray(item.innerBlocks) ? legacyToBlocks(item.innerBlocks) : [])];
    }
    const type = item.type || item.blockType || 'paragraph';
    if (type === 'heading') return [createBlock('core/heading', { level: Number(item.level) === 3 ? 3 : 2, content: item.text || '' })];
    if (type === 'image') return [createBlock('core/image', { url: item.src || item.image || '', alt: item.alt || '', caption: item.caption || '' })];
    if (type === 'quote') return [createBlock('core/quote', { value: item.text || '', citation: item.attribution || '' })];
    if (type === 'list') {
      const items = String(item.items || '').split('\n').map(text => text.trim()).filter(Boolean);
      return [createBlock('core/list', { ordered: !!item.ordered }, items.map(content => createBlock('core/list-item', { content })))];
    }
    if (type === 'divider') return [createBlock('core/separator')];
    if (type === 'callout') return [createBlock('knot/callout', { title: item.title || 'ポイント', text: item.text || '', style: item.style || 'note' })];
    if (type === 'button') return [createBlock('knot/button', { label: item.label || '詳しく見る', url: item.url || '' })];
    if (type === 'code') return [createBlock('knot/code', { code: item.code || item.text || '', language: item.language || 'text' })];
    if (type === 'table') return [createBlock('core/table', { head: item.head || [], body: item.rows || [] })];
    if (type === 'accordion') return [createBlock('knot/accordion', { title: item.title || '詳しく見る', text: item.text || '' })];
    if (type === 'notice') return [createBlock('knot/notice', { title: item.title || 'お知らせ', text: item.text || '', tone: item.tone || 'info' })];
    return [createBlock('core/paragraph', { content: item.text || '' })];
  });
}

function blocksToLegacy(blocks) {
  return blocks.map(block => {
    const a = block.attributes || {};
    if (block.name.startsWith('core/')) return { type: 'wordpress', html: serialize([block]) };
    if (block.name === 'core/paragraph') return { type: 'paragraph', text: a.content || '' };
    if (block.name === 'core/code') return { type: 'code', code: a.content || '', language: 'text' };
    if (block.name === 'core/table') return { type: 'table', head: a.head || [], rows: a.body || [] };
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
    if (block.name === 'knot/code') return { type: 'code', code: a.code || '', language: a.language || 'text' };
    if (block.name === 'knot/accordion') return { type: 'accordion', title: a.title || '詳しく見る', text: a.text || '' };
    if (block.name === 'knot/notice') return { type: 'notice', title: a.title || 'お知らせ', text: a.text || '', tone: a.tone || 'info' };
    return { type: 'paragraph', text: a.content || '' };
  });
}

const previewText = value => String(value || '').replace(/<[^>]*>/g, '');

function Editor({ value, onChange }) {
  const [blocks, setBlocks] = useState(() => legacyToBlocks(value));
  const [preview, setPreview] = useState(false);
  const [previewWidth, setPreviewWidth] = useState('desktop');
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
      settings: { allowedBlockTypes: true, __experimentalBlockPatterns: [] }
    },
      el('div', { className: 'knot-gutenberg-editor' },
        el('div', { className: 'knot-gutenberg-topbar' },
          el('strong', null, 'ブロックエディター'),
          el('span', null, '左側からブロックを選び、右側で文章を編集できます。'),
          el('button', { type: 'button', className: 'knot-preview-toggle', onClick: () => setPreview(!preview), 'aria-pressed': preview }, preview ? '編集に戻る' : 'プレビュー')
        ),
        el(BlockEditorKeyboardShortcuts, null),
        el(Popover.Slot, { name: 'block-toolbar' }),
        el('div', { className: 'knot-gutenberg-workspace' },
          el('aside', { className: 'knot-gutenberg-block-panel' },
            el('strong', { className: 'knot-gutenberg-panel-title' }, 'ブロックを追加'),
            el('p', { className: 'knot-gutenberg-panel-help' }, '追加したいブロックを選んでください。'),
            el(Inserter, { position: 'right-start', isQuick: false })
          ),
          el('main', { className: 'knot-gutenberg-canvas' },
            preview
              ? el('section', { className: 'knot-live-preview' },
                  el('div', { className: 'knot-preview-toolbar' },
                    el('strong', null, '記事プレビュー'),
                    el('div', { className: 'knot-preview-sizes' },
                      ...[['desktop','PC'],['tablet','タブレット'],['mobile','スマホ']].map(([value,label]) =>
                        el('button', { type:'button', className: previewWidth===value?'is-active':'', onClick:()=>setPreviewWidth(value), key:value }, label))
                    )
                  ),
                  el('div', { className: 'knot-preview-frame knot-preview-'+previewWidth },
                    ...blocks.map((block,index) => {
                      const a=block.attributes||{};
                      if(block.name==='core/paragraph') return el('p',{key:index,children:previewText(a.content)});
                      if(block.name==='core/heading') return el(a.level===3?'h3':'h2',{key:index,children:previewText(a.content)});
                      if(block.name==='core/image') return el('figure',{key:index},a.url?el('img',{src:a.url,alt:a.alt||''}):el('p',null,'画像URLを設定してください'),a.caption?el('figcaption',null,a.caption):null);
                      if(block.name==='core/quote') return el('blockquote',{key:index},el('p',null,a.value||''),a.citation?el('cite',null,a.citation):null);
                      if(block.name==='core/list') return el(a.ordered?'ol':'ul',{key:index},...(block.innerBlocks||[]).map((child,i)=>el('li',{key:i},child.attributes?.content||'')));
                      if(block.name==='core/separator') return el('hr',{key:index});
                      if(block.name==='core/table') return el('table',{key:index},a.head?.length?el('thead',null,el('tr',null,...a.head.map((cell,i)=>el('th',{key:i},cell.content||'')))):null,el('tbody',null,...(a.body||[]).map((row,i)=>el('tr',{key:i},...(row.cells||[]).map((cell,j)=>el('td',{key:j},cell.content||''))))));
                      if(block.name==='knot/callout'||block.name==='knot/notice') return el('aside',{key:index,className:'knot-preview-callout'},el('strong',null,a.title||'ポイント'),el('p',null,a.text||''));
                      if(block.name==='knot/button') return el('p',{key:index},el('a',{className:'knot-preview-button',href:a.url||'#'},a.label||'詳しく見る'));
                      if(block.name==='knot/code'||block.name==='core/code') return el('pre',{key:index},el('code',null,a.code||a.content||''));
                      if(block.name==='knot/accordion') return el('details',{key:index},el('summary',null,a.title||'詳しく見る'),el('p',null,a.text||''));
                      
                      return el('p',{key:index},'');
                    })
                  )
                )
              : el(BlockTools, null,
                  el(BlockInspector, null),
                  el(WritingFlow, null,
                    el(ObserveTyping, null,
                      el(BlockList, null)
                    )
                  )
                )
          )
        )
      )
    ),
    el(Popover.Slot, null)
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
