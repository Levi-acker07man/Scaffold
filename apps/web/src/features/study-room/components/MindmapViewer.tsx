"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";

/* ── Data shapes ── */
export interface MindmapTopic {
  id: string;
  label: string;
  description?: string;
  children?: MindmapTopic[];
}

/* ── Layout constants ── */
const NODE_H = 36;
const NODE_PAD_X = 24;
const NODE_PAD_Y = 8;
const H_GAP = 80;
const V_GAP = 16;
const FONT_SIZE = 13;
const CANVAS_PAD = 60;

/* ── Measure text width (approximation) ── */
function textWidth(text: string): number {
  return text.length * (FONT_SIZE * 0.58) + NODE_PAD_X * 2;
}

/* ── Positioned node for rendering ── */
interface PositionedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  children: PositionedNode[];
  subtreeHeight: number;
}

/* ══════════════════════════════════════════════════════
   TREE LAYOUT ENGINE
   Computes x,y positions for a left-to-right tree
   ══════════════════════════════════════════════════════ */

function computeSubtreeHeight(
  topic: MindmapTopic,
  expandedSet: Set<string>
): number {
  const isExpanded = expandedSet.has(topic.id);
  if (
    !topic.children ||
    topic.children.length === 0 ||
    !isExpanded
  ) {
    return NODE_H;
  }
  const childHeights = topic.children.map((c) =>
    computeSubtreeHeight(c, expandedSet)
  );
  const totalChildHeight =
    childHeights.reduce((a, b) => a + b, 0) +
    (childHeights.length - 1) * V_GAP;
  return Math.max(NODE_H, totalChildHeight);
}

function layoutTree(
  topic: MindmapTopic,
  x: number,
  yStart: number,
  depth: number,
  expandedSet: Set<string>
): PositionedNode {
  const w = Math.max(textWidth(topic.label), 100);
  const h = NODE_H;
  const hasChildren = !!(topic.children && topic.children.length > 0);
  const isExpanded = expandedSet.has(topic.id);

  const subtreeH = computeSubtreeHeight(topic, expandedSet);
  const y = yStart + subtreeH / 2 - h / 2;

  const children: PositionedNode[] = [];

  if (hasChildren && isExpanded) {
    const childX = x + w + H_GAP;
    let childY = yStart;
    for (const child of topic.children!) {
      const childSubH = computeSubtreeHeight(child, expandedSet);
      children.push(
        layoutTree(child, childX, childY, depth + 1, expandedSet)
      );
      childY += childSubH + V_GAP;
    }
  }

  return {
    id: topic.id,
    label: topic.label,
    x,
    y,
    w,
    h,
    depth,
    hasChildren,
    expanded: isExpanded,
    children,
    subtreeHeight: subtreeH,
  };
}

/* ══════════════════════════════════════════════════════
   SVG BEZIER EDGES
   ══════════════════════════════════════════════════════ */

function renderEdges(node: PositionedNode): JSX.Element[] {
  const edges: JSX.Element[] = [];

  if (node.expanded && node.children.length > 0) {
    const startX = node.x + node.w;
    const startY = node.y + node.h / 2;

    for (const child of node.children) {
      const endX = child.x;
      const endY = child.y + child.h / 2;
      const cpOffset = H_GAP * 0.55;

      const d = `M ${startX} ${startY} C ${startX + cpOffset} ${startY}, ${endX - cpOffset} ${endY}, ${endX} ${endY}`;

      edges.push(
        <path
          key={`edge-${node.id}-${child.id}`}
          d={d}
          fill="none"
          stroke="var(--clay-border)"
          strokeWidth="1.5"
          className="transition-all duration-300"
        />
      );

      edges.push(...renderEdges(child));
    }
  }

  return edges;
}

/* ══════════════════════════════════════════════════════
   EXPLORE IN CHAT HOVER TOOLTIP (BIGGER & ZERO GAP)
   ══════════════════════════════════════════════════════ */

function ExploreInChatTooltip({
  label,
  onExploreInChat,
}: {
  label: string;
  onExploreInChat?: (label: string) => void;
}) {
  if (!onExploreInChat) return null;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 -mb-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50 flex flex-col items-center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onExploreInChat(label);
        }}
        className="flex items-center gap-2 bg-accent-base text-[var(--color-void)] px-4 py-2 rounded-xl text-xs font-extrabold shadow-xl hover:scale-105 hover:bg-accent-base/90 whitespace-nowrap cursor-pointer border border-white/25"
        title="Explore in chat"
      >
        <span className="text-base">💬</span>
        <span>Explore in chat</span>
      </button>
      <div className="w-3 h-3 bg-accent-base rotate-45 -mt-1.5 rounded-xs border-r border-b border-white/25" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   NODE COMPONENT
   ══════════════════════════════════════════════════════ */

function MindmapNode({
  node,
  onToggle,
  onExploreInChat,
}: {
  node: PositionedNode;
  onToggle: (id: string) => void;
  onExploreInChat?: (label: string) => void;
}) {
  const isRoot = node.depth === 0;
  const isLeaf = !node.hasChildren;

  // Depth-based styling to match the screenshot
  // Root: dark bg with light text, Children: subtle bg with border
  const rootClass =
    "bg-[var(--accent-base)] text-[var(--color-void)] border-transparent shadow-md";
  const branchClass =
    "bg-[var(--input-bg)] text-text border border-clay-border hover:border-[var(--card-hover-border)]";
  const leafClass =
    "bg-[var(--color-panel-2)] text-text border border-clay-border hover:border-[var(--card-hover-border)]";

  const nodeClass = isRoot ? rootClass : isLeaf ? leafClass : branchClass;

  return (
    <div
      className="absolute group select-none"
      style={{
        left: node.x,
        top: node.y,
        width: node.w,
        height: node.h,
        zIndex: 20,
      }}
    >
      <button
        onClick={() => node.hasChildren && onToggle(node.id)}
        className={`w-full h-full flex items-center gap-1.5 rounded-lg px-4 transition-all duration-200 select-none whitespace-nowrap ${nodeClass} ${
          node.hasChildren ? "cursor-pointer" : "cursor-default"
        }`}
        style={{
          fontSize: FONT_SIZE,
          fontWeight: 600,
        }}
      >
        <span className="flex-1 truncate">{node.label}</span>
        {node.hasChildren && (
          <span
            className={`text-xs flex-shrink-0 transition-transform duration-200 ${
              isRoot ? "opacity-70" : "text-text-dimmer"
            } ${node.expanded ? "" : ""}`}
          >
            {node.expanded ? "‹" : "›"}
          </span>
        )}
      </button>

      <ExploreInChatTooltip label={node.label} onExploreInChat={onExploreInChat} />
    </div>
  );
}

function renderNodes(
  node: PositionedNode,
  onToggle: (id: string) => void,
  onExploreInChat?: (label: string) => void
): JSX.Element[] {
  const elements: JSX.Element[] = [];
  elements.push(
    <MindmapNode
      key={node.id}
      node={node}
      onToggle={onToggle}
      onExploreInChat={onExploreInChat}
    />
  );
  if (node.expanded) {
    for (const child of node.children) {
      elements.push(...renderNodes(child, onToggle, onExploreInChat));
    }
  }
  return elements;
}

/* ══════════════════════════════════════════════════════
   CANVAS BOUNDS
   ══════════════════════════════════════════════════════ */

function getTreeBounds(node: PositionedNode): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = node.x;
  let minY = node.y;
  let maxX = node.x + node.w;
  let maxY = node.y + node.h;

  if (node.expanded) {
    for (const child of node.children) {
      const cb = getTreeBounds(child);
      minX = Math.min(minX, cb.minX);
      minY = Math.min(minY, cb.minY);
      maxX = Math.max(maxX, cb.maxX);
      maxY = Math.max(maxY, cb.maxY);
    }
  }

  return { minX, minY, maxX, maxY };
}

/* ══════════════════════════════════════════════════════
   LEARN MINDMAP — Full horizontal tree on canvas
   ══════════════════════════════════════════════════════ */

interface LearnMindmapProps {
  topics: MindmapTopic[];
  title: string;
  onExploreInChat?: (label: string) => void;
}

export function LearnMindmap({ topics, title, onExploreInChat }: LearnMindmapProps) {
  // We wrap all root-level topics under a virtual root
  const virtualRoot: MindmapTopic = useMemo(() => {
    const effectiveTopics =
      topics.length === 1 && topics[0].children && (topics[0].children.length || 0) > 1
        ? topics[0].children
        : topics;

    return {
      id: "__root__",
      label: title,
      children: effectiveTopics,
    };
  }, [topics, title]);

  // Track expanded nodes — start with all expanded
  const [expandedSet, setExpandedSet] = useState<Set<string>>(() => {
    const set = new Set<string>();
    const walk = (t: MindmapTopic) => {
      set.add(t.id);
      t.children?.forEach(walk);
    };
    walk(virtualRoot);
    return set;
  });

  // Pan & zoom state
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: CANVAS_PAD, y: CANVAS_PAD });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const toggleNode = useCallback((id: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Layout
  const tree = useMemo(
    () => layoutTree(virtualRoot, 0, 0, 0, expandedSet),
    [virtualRoot, expandedSet]
  );

  const bounds = useMemo(() => getTreeBounds(tree), [tree]);
  const canvasW = bounds.maxX - bounds.minX + CANVAS_PAD * 2;
  const canvasH = bounds.maxY - bounds.minY + CANVAS_PAD * 2;

  // Center on mount
  useEffect(() => {
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const scale = Math.min(
        cw / (canvasW + 40),
        ch / (canvasH + 40),
        1
      );
      setZoom(Math.max(scale, 0.4));
      setPan({
        x: (cw - canvasW * scale) / 2,
        y: (ch - canvasH * scale) / 2,
      });
    }
  }, []); // only on mount

  // Pan handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    },
    [pan]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      });
    },
    [isPanning]
  );

  const onMouseUp = useCallback(() => setIsPanning(false), []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom((z) => Math.min(Math.max(z + delta, 0.25), 2));
    },
    []
  );

  const zoomIn = () => setZoom((z) => Math.min(z + 0.15, 2));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.25));
  const fitView = useCallback(() => {
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const scale = Math.min(cw / (canvasW + 40), ch / (canvasH + 40), 1);
      setZoom(Math.max(scale, 0.3));
      setPan({
        x: (cw - canvasW * scale) / 2,
        y: (ch - canvasH * scale) / 2,
      });
    }
  }, [canvasW, canvasH]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden select-none"
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      {/* Canvas with pan + zoom */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: canvasW,
          height: canvasH,
          position: "relative",
        }}
      >
        {/* SVG edges layer */}
        <svg
          width={canvasW}
          height={canvasH}
          className="absolute inset-0 pointer-events-none"
        >
          <g transform={`translate(${CANVAS_PAD - bounds.minX}, ${CANVAS_PAD - bounds.minY})`}>
            {renderEdges(tree)}
          </g>
        </svg>

        {/* Nodes layer */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${CANVAS_PAD - bounds.minX}px, ${CANVAS_PAD - bounds.minY}px)`,
          }}
        >
          {renderNodes(tree, toggleNode, onExploreInChat)}
        </div>
      </div>

      {/* Zoom controls — bottom-right like NotebookLM */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-20">
        <button
          onClick={fitView}
          className="w-9 h-9 rounded-lg bg-[var(--clay-bg)] border border-clay-border flex items-center justify-center hover:bg-[var(--card-hover-bg)] transition-colors text-text-dim hover:text-text"
          title="Fit to view"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
        <button
          onClick={zoomIn}
          className="w-9 h-9 rounded-lg bg-[var(--clay-bg)] border border-clay-border flex items-center justify-center hover:bg-[var(--card-hover-bg)] transition-colors text-text-dim hover:text-text text-lg font-bold"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-9 h-9 rounded-lg bg-[var(--clay-bg)] border border-clay-border flex items-center justify-center hover:bg-[var(--card-hover-bg)] transition-colors text-text-dim hover:text-text text-lg font-bold"
          title="Zoom out"
        >
          −
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SOLVE MODE — Progressive Socratic reveal
   Same visual style but steps unlock one at a time
   ══════════════════════════════════════════════════════ */

export interface SocraticStep {
  id: string;
  label: string;
  hint: string;
  detail?: string;
}

interface SolveMindmapProps {
  problemTitle: string;
  steps: SocraticStep[];
  onExploreInChat?: (label: string) => void;
}

export function SolveMindmap({ problemTitle, steps, onExploreInChat }: SolveMindmapProps) {
  const [revealedCount, setRevealedCount] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: CANVAS_PAD, y: CANVAS_PAD });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const revealNext = () => {
    if (revealedCount < steps.length) {
      setRevealedCount((prev) => prev + 1);
    }
  };

  const hasMore = revealedCount < steps.length;

  // Build positioned nodes from revealed steps
  const rootW = Math.max(textWidth(problemTitle), 140);
  const rootY_center = (revealedCount * (NODE_H + V_GAP)) / 2;

  const rootNode: PositionedNode = {
    id: "__solve_root__",
    label: problemTitle,
    x: 0,
    y: rootY_center - NODE_H / 2,
    w: rootW,
    h: NODE_H,
    depth: 0,
    hasChildren: true,
    expanded: true,
    subtreeHeight: revealedCount * (NODE_H + V_GAP),
    children: [],
  };

  // Position revealed steps vertically as children of root
  const visibleSteps = steps.slice(0, revealedCount);
  let yOffset = 0;
  for (const step of visibleSteps) {
    const sw = Math.max(textWidth(step.label), 120);
    rootNode.children.push({
      id: step.id,
      label: step.label,
      x: rootW + H_GAP,
      y: yOffset,
      w: sw,
      h: NODE_H,
      depth: 1,
      hasChildren: false,
      expanded: false,
      subtreeHeight: NODE_H,
      children: [],
    });
    yOffset += NODE_H + V_GAP;
  }

  // Add a placeholder for the next hint
  if (hasMore) {
    const nextW = textWidth("Reveal next hint →");
    rootNode.children.push({
      id: "__reveal__",
      label: "Reveal next hint →",
      x: rootW + H_GAP,
      y: yOffset,
      w: nextW,
      h: NODE_H,
      depth: 1,
      hasChildren: false,
      expanded: false,
      subtreeHeight: NODE_H,
      children: [],
    });
  }

  const bounds = getTreeBounds(rootNode);
  const canvasW = bounds.maxX - bounds.minX + CANVAS_PAD * 2;
  const canvasH = bounds.maxY - bounds.minY + CANVAS_PAD * 2;

  // Center on mount
  useEffect(() => {
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const scale = Math.min(cw / (canvasW + 40), ch / (canvasH + 40), 1);
      setZoom(Math.max(scale, 0.4));
      setPan({
        x: (cw - canvasW * scale) / 2,
        y: (ch - canvasH * scale) / 2,
      });
    }
  }, [revealedCount, canvasW, canvasH]);

  // Pan handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    },
    [pan]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      });
    },
    [isPanning]
  );

  const onMouseUp = useCallback(() => setIsPanning(false), []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((z) => Math.min(Math.max(z + delta, 0.25), 2));
  }, []);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.15, 2));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.25));
  const fitView = useCallback(() => {
    if (containerRef.current) {
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const scale = Math.min(cw / (canvasW + 40), ch / (canvasH + 40), 1);
      setZoom(Math.max(scale, 0.3));
      setPan({
        x: (cw - canvasW * scale) / 2,
        y: (ch - canvasH * scale) / 2,
      });
    }
  }, [canvasW, canvasH]);

  // Render edges from root to visible steps
  const edges: JSX.Element[] = [];
  const startX = rootNode.x + rootNode.w;
  const startY = rootNode.y + rootNode.h / 2;

  for (const child of rootNode.children) {
    const endX = child.x;
    const endY = child.y + child.h / 2;
    const cpOffset = H_GAP * 0.55;
    const isRevealBtn = child.id === "__reveal__";

    edges.push(
      <path
        key={`edge-root-${child.id}`}
        d={`M ${startX} ${startY} C ${startX + cpOffset} ${startY}, ${endX - cpOffset} ${endY}, ${endX} ${endY}`}
        fill="none"
        stroke={isRevealBtn ? "var(--clay-border)" : "var(--clay-border)"}
        strokeWidth="1.5"
        strokeDasharray={isRevealBtn ? "4 4" : "none"}
        className="transition-all duration-300"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden select-none"
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: canvasW,
          height: canvasH,
          position: "relative",
        }}
      >
        {/* SVG edges */}
        <svg width={canvasW} height={canvasH} className="absolute inset-0 pointer-events-none">
          <g transform={`translate(${CANVAS_PAD - bounds.minX}, ${CANVAS_PAD - bounds.minY})`}>
            {edges}
          </g>
        </svg>

        {/* Nodes */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${CANVAS_PAD - bounds.minX}px, ${CANVAS_PAD - bounds.minY}px)`,
          }}
        >
          {/* Root node */}
          <div
            className="absolute group select-none"
            style={{
              left: rootNode.x,
              top: rootNode.y,
              width: rootNode.w,
              height: rootNode.h,
              zIndex: 20,
            }}
          >
            <div
              className="w-full h-full flex items-center gap-1.5 rounded-lg px-4 bg-[var(--accent-base)] text-[var(--color-void)] border-transparent shadow-md whitespace-nowrap"
              style={{
                fontSize: FONT_SIZE,
                fontWeight: 600,
              }}
            >
              <span className="flex-1 truncate">{rootNode.label}</span>
              <span className="text-xs opacity-70">‹</span>
            </div>

            <ExploreInChatTooltip label={rootNode.label} onExploreInChat={onExploreInChat} />
          </div>

          {/* Step nodes */}
          {rootNode.children.map((child, idx) => {
            const isRevealBtn = child.id === "__reveal__";
            const isLatest = idx === revealedCount - 1 && !isRevealBtn;

            if (isRevealBtn) {
              return (
                <button
                  key={child.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    revealNext();
                  }}
                  className="absolute flex items-center gap-1.5 rounded-lg px-4 border-2 border-dashed border-clay-border bg-transparent hover:bg-accent-bg hover:border-accent-base/30 transition-all cursor-pointer whitespace-nowrap text-text-dim hover:text-text"
                  style={{
                    left: child.x,
                    top: child.y,
                    width: child.w,
                    height: child.h,
                    fontSize: FONT_SIZE,
                    fontWeight: 600,
                  }}
                >
                  <span className="flex-1 truncate">{child.label}</span>
                </button>
              );
            }

            return (
              <div
                key={child.id}
                className="absolute group select-none"
                style={{
                  left: child.x,
                  top: child.y,
                  width: child.w,
                  height: child.h,
                  zIndex: 20,
                }}
              >
                <div
                  className={`w-full h-full flex items-center gap-1.5 rounded-lg px-4 border whitespace-nowrap transition-all duration-300 ${
                    isLatest
                      ? "bg-accent-bg border-accent-base/30 text-text shadow-sm"
                      : "bg-[var(--input-bg)] border-clay-border text-text"
                  }`}
                  style={{
                    fontSize: FONT_SIZE,
                    fontWeight: 600,
                  }}
                >
                  <span className="w-5 h-5 rounded-full bg-accent-base/10 text-accent-base text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 truncate">{child.label}</span>
                </div>

                <ExploreInChatTooltip label={child.label} onExploreInChat={onExploreInChat} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Hint count indicator */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--clay-bg)] border border-clay-border text-xs font-bold text-text-dim">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        {revealedCount}/{steps.length} hints
        {!hasMore && (
          <span className="text-green-500 ml-1">✓</span>
        )}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-20">
        <button
          onClick={fitView}
          className="w-9 h-9 rounded-lg bg-[var(--clay-bg)] border border-clay-border flex items-center justify-center hover:bg-[var(--card-hover-bg)] transition-colors text-text-dim hover:text-text"
          title="Fit to view"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
        <button
          onClick={zoomIn}
          className="w-9 h-9 rounded-lg bg-[var(--clay-bg)] border border-clay-border flex items-center justify-center hover:bg-[var(--card-hover-bg)] transition-colors text-text-dim hover:text-text text-lg font-bold"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-9 h-9 rounded-lg bg-[var(--clay-bg)] border border-clay-border flex items-center justify-center hover:bg-[var(--card-hover-bg)] transition-colors text-text-dim hover:text-text text-lg font-bold"
        >
          −
        </button>
      </div>
    </div>
  );
}
