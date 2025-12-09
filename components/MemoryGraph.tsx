import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { Memory, Lorebook, Character, StylePreference } from '../types';
import { forceX, forceY } from 'd3-force';

export interface MemoryGraphProps {
  memories: Memory[];
  lorebooks: Lorebook[];
  characters: Character[];
  stylePreferences: StylePreference[];
  similarityThreshold: number;
  repelForce: number;
  linkDistance: number;
}

type GraphNodeData = {
  id: string;
  name: string;
  type: string;
  val: number;
  embedding: number[];
  data: any;
  scope?: string;
};

// Cosine Similarity function
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};


const MemoryGraph: React.FC<MemoryGraphProps> = ({ memories, lorebooks, characters, stylePreferences, similarityThreshold, repelForce, linkDistance }) => {
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    
    updateDimensions();
    const observer = new ResizeObserver((_entries) => updateDimensions());
    if (containerRef.current) observer.observe(containerRef.current);
    
    window.addEventListener('resize', updateDimensions);
    return () => {
        window.removeEventListener('resize', updateDimensions);
        observer.disconnect();
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    // Use a timeout to allow the UI to update to the loading state before this heavy computation blocks the main thread.
    const timer = setTimeout(() => {
      const allNodes: GraphNodeData[] = [];
      const nodeMap = new Map<string, GraphNodeData>();

      const addNode = (node: GraphNodeData) => {
        if (node.embedding && node.embedding.length > 0 && !nodeMap.has(node.id)) {
          allNodes.push(node);
          nodeMap.set(node.id, node);
        }
      };
      
      // 1. Process all data sources into a flat node list
      characters.forEach(char => {
        if (char.id !== 'omni-ai') {
          addNode({ id: `char-${char.id}`, name: char.name, type: 'Character', val: 15, embedding: char.embedding!, data: char });
        }
      });
      lorebooks.forEach(lb => lb.entries.forEach(entry => addNode({ id: `lore-${entry.id}`, name: entry.content, type: 'Lorebook Entry', val: 5, embedding: entry.embedding!, data: { ...entry, lorebookName: lb.name } })));
      memories.forEach(mem => addNode({ id: `mem-${mem.id}`, name: mem.content, type: 'Memory', scope: mem.scope, val: 3, embedding: mem.embedding!, data: mem }));
      stylePreferences.forEach(style => addNode({ id: `style-${style.id}`, name: style.content, type: 'Style Preference', val: 4, embedding: style.embedding!, data: style }));

      // 2. Calculate links based on similarity
      const allLinks: { source: string; target: string; value: number }[] = [];
      for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
          const nodeA = allNodes[i];
          const nodeB = allNodes[j];
          const similarity = cosineSimilarity(nodeA.embedding, nodeB.embedding);
          if (similarity > similarityThreshold) {
            allLinks.push({ source: nodeA.id, target: nodeB.id, value: similarity });
          }
        }
      }

      setGraphData({ nodes: allNodes, links: allLinks });
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [memories, lorebooks, characters, stylePreferences, similarityThreshold]);

  useEffect(() => {
    if (fgRef.current) {
      // Set the strength of the charge (repulsion) force
      fgRef.current.d3Force('charge').strength(repelForce);
      // Reheat the simulation to apply the new force strength
      fgRef.current.d3ReheatSimulation();
    }
  }, [repelForce]);
  
  useEffect(() => {
    if (fgRef.current) {
      // Set the target distance for links
      fgRef.current.d3Force('link').distance(linkDistance);
      // Reheat the simulation to apply the new force strength
      fgRef.current.d3ReheatSimulation();
    }
  }, [linkDistance]);
  
  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node);
  }, []);

  const getNodeColor = (node: any) => {
    switch (node.type) {
      case 'Character': return '#ec4899'; // pink-500
      case 'Style Preference': return '#7F5AF0'; // accent (purple)
      case 'Lorebook Entry': return '#06b6d4'; // cyan-500
      case 'Memory':
        switch (node.scope) {
          case 'global': return '#84cc16'; // lime-500
          case 'character': return '#f97316'; // orange-500
          case 'conversation': return '#f59e0b'; // amber-500
          default: return '#6b7280'; // gray-500
        }
      default: return '#6b7280';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-[65vh] bg-primary rounded-lg border border-tertiary overflow-hidden">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center text-text-secondary">
          <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-accent mr-4"></div>
          Calculating semantic relationships...
        </div>
      ) : graphData.nodes.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-text-secondary">
              No items with embeddings found. Go to Maintenance to generate them.
          </div>
      ) : (
        dimensions.width > 0 && dimensions.height > 0 && (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor={getNodeColor}
            linkColor={() => 'rgba(139, 148, 158, 0.3)'}
            linkWidth={link => (link as any).value * 2}
            onNodeHover={handleNodeHover}
            cooldownTicks={100}
            d3AlphaDecay={0.05}
          />
        )
      )}
       {hoveredNode && (
        <div className="absolute top-2 left-2 p-3 bg-secondary/80 backdrop-blur-sm rounded-md border border-tertiary text-sm max-w-sm pointer-events-none z-10">
          <p className="font-bold capitalize" style={{color: getNodeColor(hoveredNode)}}>
            {hoveredNode.type}
            {hoveredNode.scope && ` (${hoveredNode.scope})`}
          </p>
          <p className="text-text-primary mt-1 max-h-40 overflow-y-auto text-xs">{hoveredNode.name}</p>
           {hoveredNode.data?.lorebookName && (
            <p className="text-xs text-text-secondary mt-2">
              From: <span className="italic">{hoveredNode.data.lorebookName}</span>
            </p>
          )}
        </div>
      )}
      <div className="absolute bottom-2 right-2 p-2 bg-secondary/80 backdrop-blur-sm rounded-md border border-tertiary text-xs text-text-secondary z-10">
          <h4 className="font-bold text-text-primary mb-1">Legend</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: '#ec4899'}}></div>Character</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: '#7F5AF0'}}></div>Style Preference</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: '#06b6d4'}}></div>Lore Entry</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: '#84cc16'}}></div>Global Memory</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: '#f97316'}}></div>Character Memory</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: '#f59e0b'}}></div>Chat Memory</div>
          </div>
      </div>
    </div>
  );
};

export default MemoryGraph;