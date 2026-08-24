const fs = require('fs');
const file = 'src/features/website/components/CanvasEditor.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add useRef and useEffect for measuring container width
code = code.replace(
  "const [zoom, setZoom] = useState(1);",
  "const [zoom, setZoom] = useState(1);\n  const containerRef = React.useRef<HTMLDivElement>(null);\n  const [containerWidth, setContainerWidth] = useState(1200);\n\n  React.useEffect(() => {\n    const observer = new ResizeObserver(entries => {\n      for (let entry of entries) {\n        setContainerWidth(entry.contentRect.width);\n      }\n    });\n    if (containerRef.current) observer.observe(containerRef.current);\n    return () => observer.disconnect();\n  }, []);"
);

// 2. Update the canvas wrapper div
code = code.replace(
  /width: `\$\{canvasWidth\}px`,/g,
  "width: viewMode === 'desktop' ? '100%' : `${canvasWidth}px`,"
);

code = code.replace(
  /<div\n\s+style={{/g,
  "<div\n          ref={containerRef}\n          style={{"
);

// 3. Update Rnd mapping
code = code.replace(
  /\{block\.elements\.map\(\(el, index\) => \(/g,
  "{block.elements.map((el, index) => {\n            const offsetX = viewMode === 'desktop' ? Math.max(0, (containerWidth - 1200) / 2) : 0;\n            const displayX = el.styles?.fullWidth ? 0 : el[viewMode].x + offsetX;\n            const displayWidth = el.styles?.fullWidth ? containerWidth : el[viewMode].width;\n            return ("
);

// Add closing brace for the map function
code = code.replace(
  /<\/Rnd>\n\s+\)\)}/g,
  "</Rnd>\n            );\n          })}"
);

// 4. Update Rnd props
code = code.replace(
  /size={{ width: el\.styles\?\.fullWidth \? canvasWidth : el\[viewMode\]\.width, height: el\[viewMode\]\.height }}/g,
  "size={{ width: displayWidth, height: el[viewMode].height }}"
);

code = code.replace(
  /position={{ x: el\.styles\?\.fullWidth \? 0 : el\[viewMode\]\.x, y: el\[viewMode\]\.y }}/g,
  "position={{ x: displayX, y: el[viewMode].y }}"
);

code = code.replace(
  /updateElement\(el\.id, \{ \[viewMode\]: \{ \.\.\.el\[viewMode\], x: d\.x, y: d\.y \} \}\);/g,
  "updateElement(el.id, { [viewMode]: { ...el[viewMode], x: d.x - offsetX, y: d.y } });"
);

code = code.replace(
  /x: position\.x,\n\s+y: position\.y/g,
  "x: position.x - offsetX,\n                    y: position.y"
);

// 5. Draw the safe zone guide
code = code.replace(
  /\{block\.elements\.map/g,
  "{viewMode === 'desktop' && (\n            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1200px', transform: 'translateX(-50%)', borderLeft: '1px dashed rgba(0,0,0,0.1)', borderRight: '1px dashed rgba(0,0,0,0.1)', pointerEvents: 'none', zIndex: 0 }} />\n          )}\n          {block.elements.map"
);

fs.writeFileSync(file, code);
