import React, { useMemo } from 'react';

interface DiffViewProps {
  oldStr: string;
  newStr: string;
}

// Correct implementation of a line-based diff using Longest Common Subsequence.
const diffLines = (oldLines: string[], newLines: string[]) => {
  const n = oldLines.length;
  const m = newLines.length;
  const lcs = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));

  // Build LCS table
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  // Backtrack to find the diff
  const result = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'common', line: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      result.unshift({ type: 'added', line: newLines[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || lcs[i][j - 1] < lcs[i - 1][j])) {
      result.unshift({ type: 'removed', line: oldLines[i - 1] });
      i--;
    } else {
      break;
    }
  }
  return result;
};


const DiffView: React.FC<DiffViewProps> = ({ oldStr, newStr }) => {
  const diffResult = useMemo(() => {
    const oldLines = oldStr ? oldStr.split('\n') : [];
    const newLines = newStr ? newStr.split('\n') : [];
    return diffLines(oldLines, newLines);
  }, [oldStr, newStr]);

  if (oldStr === newStr) {
      return <pre className="whitespace-pre-wrap font-sans">{oldStr}</pre>;
  }

  if (!diffResult || diffResult.length === 0) {
      return (
          <pre className="whitespace-pre-wrap font-sans text-xs">
              <div className="bg-red-500/20"><span className="select-none">- </span><span>{oldStr}</span></div>
              <div className="bg-green-500/20"><span className="select-none">+ </span><span>{newStr}</span></div>
          </pre>
      );
  }

  return (
    <pre className="whitespace-pre-wrap font-sans text-xs">
      {diffResult.map((part, index) => {
        const style = {
          common: 'bg-transparent',
          added: 'bg-green-500/20',
          removed: 'bg-red-500/20',
        }[part.type];

        const prefix = {
          common: '  ',
          added: '+ ',
          removed: '- ',
        }[part.type];

        return (
          <div key={index} className={style}>
            <span className="select-none">{prefix}</span>
            <span>{part.line}</span>
          </div>
        );
      })}
    </pre>
  );
};

export default DiffView;
