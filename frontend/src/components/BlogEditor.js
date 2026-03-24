import { useEffect, useRef, useState, useCallback } from "react";
import { EditorState, Prec } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { getSuggestion } from "../api/blogApi";
import { auth } from "../firebase/firebase";
import "./BlogEditor.css";

//Outside component — no dependency issue
const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function BlogEditor({
  onChange,
  onPublish,
  onSaveDraft,
  initialTitle = "",
  initialContent = "",
}) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const debounceRef = useRef(null);
  const suggestionRef = useRef("");
  const contentRef = useRef(initialContent);

  const [suggestion, setSuggestion] = useState("");
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [loadingTags, setLoadingTags] = useState(false);

  const generateTags = useCallback(async (text) => {
    if (!text.trim() || text.trim().length < 30) return;
    setLoadingTags(true);
    try {
      const freshToken = await auth.currentUser.getIdToken(true);
      const res = await fetch(`${BASE_URL}/suggest-tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setTags(data.tags || []);
    } catch (err) {
      console.error("Tag generation error:", err);
    } finally {
      setLoadingTags(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSuggestion = useCallback(async (text) => {
    if (!text.trim() || text.trim().length < 20) return;
    setLoadingSuggest(true);
    try {
      const freshToken = await auth.currentUser.getIdToken(true);
      const res = await getSuggestion(freshToken, text);
      const s = res.data.suggestion;
      setSuggestion(s);
      suggestionRef.current = s;
    } catch (err) {
      console.error("Suggestion error:", err);
    } finally {
      setLoadingSuggest(false);
    }
  }, []);

  const acceptSuggestion = useCallback(() => {
    const s = suggestionRef.current;
    if (!s || !viewRef.current) return;
    const view = viewRef.current;
    const pos = view.state.doc.length;
    view.dispatch({
      changes: { from: pos, insert: " " + s },
      selection: { anchor: pos + s.length + 1 },
    });
    setSuggestion("");
    suggestionRef.current = "";
    const newText = view.state.doc.toString();
    contentRef.current = newText;
    onChange(newText);
  }, [onChange]);

  const insertAtCursor = useCallback((before, after = "") => {
    const view = viewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.doc.sliceString(from, to);
    view.dispatch({
      changes: { from, to, insert: before + selected + after },
      selection: {
        anchor: from + before.length,
        head: from + before.length + selected.length,
      },
    });
    view.focus();
  }, []);

  const removeTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag));

  const addTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      setTags((prev) => [...new Set([...prev, tagInput.trim()])]);
      setTagInput("");
    }
  };

  useEffect(() => {
    if (!editorRef.current) return;

    const tabKeymap = Prec.highest(
      keymap.of([
        {
          key: "Tab",
          run: () => {
            if (suggestionRef.current) {
              acceptSuggestion();
              return true;
            }
            return false;
          },
        },
      ]),
    );

    const state = EditorState.create({
      doc: initialContent || "",
      extensions: [
        tabKeymap,
        keymap.of(defaultKeymap),
        markdown(),
        oneDark,
        placeholder(
          "Start writing your blog here...\n\nTip: Pause for 2 seconds to get AI suggestions. Press Tab to accept.",
        ),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const text = update.state.doc.toString();
            contentRef.current = text;
            onChange(text);
            setSuggestion("");
            suggestionRef.current = "";
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              fetchSuggestion(text);
            }, 2000);
          }
        }),
        EditorView.theme({
          "&": {
            fontSize: "15px",
            fontFamily: "'Syne', system-ui, sans-serif",
            minHeight: "400px",
            background: "transparent",
          },
          ".cm-content": {
            padding: "20px",
            lineHeight: "1.8",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          },
          ".cm-focused": { outline: "none" },
          ".cm-editor": {
            borderRadius: "0 0 14px 14px",
            background: "rgba(255,255,255,0.03)",
          },
          ".cm-scroller": { overflow: "auto" },
          ".cm-header-1": {
            fontSize: "24px",
            fontWeight: "700",
            color: "#fff",
          },
          ".cm-header-2": {
            fontSize: "20px",
            fontWeight: "600",
            color: "#eee",
          },
          ".cm-header-3": {
            fontSize: "17px",
            fontWeight: "600",
            color: "#ddd",
          },
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePublish = () => {
    if (onPublish) onPublish(title, contentRef.current, tags);
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) onSaveDraft(title, contentRef.current, tags);
  };

  return (
    <div className="blog-editor-wrap">
      <input
        className="blog-editor-title"
        placeholder="Blog title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="blog-editor-toolbar">
        <button onClick={() => insertAtCursor("# ")} title="Heading 1">
          H1
        </button>
        <button onClick={() => insertAtCursor("## ")} title="Heading 2">
          H2
        </button>
        <button onClick={() => insertAtCursor("### ")} title="Heading 3">
          H3
        </button>
        <div className="toolbar-divider" />
        <button onClick={() => insertAtCursor("**", "**")} title="Bold">
          <b>B</b>
        </button>
        <button onClick={() => insertAtCursor("*", "*")} title="Italic">
          <i>I</i>
        </button>
        <button onClick={() => insertAtCursor("> ")} title="Quote">
          ❝
        </button>
        <button onClick={() => insertAtCursor("- ")} title="List">
          ☰
        </button>
        <div className="toolbar-divider" />
        <button
          className="toolbar-draft-btn"
          onClick={handleSaveDraft}
          disabled={!title.trim() || !contentRef.current.trim()}
        >
          Save Draft
        </button>
        <button
          className="toolbar-publish-btn"
          onClick={handlePublish}
          disabled={!title.trim() || !contentRef.current.trim()}
        >
          Publish →
        </button>
      </div>

      <div className="blog-editor-box" ref={editorRef} />

      <div className="blog-editor-tags-section">
        <div className="tags-header">
          <span className="tags-label">Tags</span>
          <button
            className="tags-suggest-btn"
            onClick={() => generateTags(contentRef.current)}
            disabled={loadingTags || contentRef.current.trim().length < 30}
          >
            {loadingTags ? "Generating..." : "✦ AI Suggest Tags"}
          </button>
        </div>
        <div className="tags-list">
          {tags.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
              <button className="tag-remove" onClick={() => removeTag(tag)}>
                ×
              </button>
            </span>
          ))}
          <input
            className="tag-input"
            placeholder="Add tag, press Enter..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
          />
        </div>
      </div>

      {suggestion && (
        <div className="blog-editor-suggestion">
          <span className="suggestion-text">{suggestion}</span>
          <span className="suggestion-hint">TAB TO ACCEPT</span>
        </div>
      )}

      {loadingSuggest && (
        <div className="blog-editor-thinking">
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-dot" />
          <span className="thinking-label">AI thinking...</span>
        </div>
      )}
    </div>
  );
}
