import { jsPDF } from "jspdf";

export const generatePDF = async (
  data: any[],
  filename: string,
  title: string,
  headers: string[],
  typeLabel?: string
) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const headerHeight = 35;
  let currentY = margin + headerHeight;

  // Modern gradient-style header background
  doc.setFillColor(15, 45, 95);
  doc.rect(0, 0, pageWidth, margin + 28, "F");
  
  // Accent bar
  doc.setFillColor(65, 140, 240);
  doc.rect(0, margin + 28, pageWidth, 2, "F");

  // Main title - professional font
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, margin + 12, { align: "center" });

  // Subtitle with enhanced spacing
  doc.setFontSize(9);
  doc.setTextColor(200, 220, 245);
  doc.setFont("helvetica", "normal");
  const timestamp = `${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })} • ${new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`;
  
  if (typeLabel) {
    doc.text(`${typeLabel} • ${timestamp}`, pageWidth / 2, margin + 22, { align: "center" });
  } else {
    doc.text(timestamp, pageWidth / 2, margin + 22, { align: "center" });
  }

  currentY = margin + 35;

  // Dynamic column width calculation based on content
  const availableWidth = pageWidth - 2 * margin;
  
  // Set specific widths for each column type
  const getColumnWidth = (header: string, index: number) => {
    const headerLower = header.toLowerCase();
    if (headerLower === '#') return 12;
    if (headerLower.includes('id') || headerLower.includes('builder')) return 35;
    if (headerLower.includes('email')) return 45;
    if (headerLower.includes('phone')) return 30;
    if (headerLower.includes('name')) return 40;
    if (headerLower.includes('county') || headerLower.includes('subCounty')) return 30;
    if (headerLower.includes('estate')) return 25;
    if (headerLower.includes('gender')) return 20;
    if (headerLower.includes('status') || headerLower.includes('type')) return 25;
    if (headerLower.includes('registration')) return 25;
    return 30; // default
  };
  
  const colWidths = headers.map((header, idx) => getColumnWidth(header, idx));
  
  // Normalize to fit available width
  const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);
  const normalizedWidths = colWidths.map(w => (w / totalWidth) * availableWidth);

  const rowHeight = 9;
  const headerRowHeight = 12;
  const footerHeight = 15;
  const pageBottomMargin = pageHeight - margin - footerHeight;

  let pageNumber = 1;
  const totalPages = Math.ceil(data.length / Math.floor((pageBottomMargin - currentY) / rowHeight));

  // Function to draw modern table header
  const drawTableHeader = (startY: number) => {
    let x = margin;
    
    headers.forEach((header, i) => {
      // Header cell background
      doc.setFillColor(30, 60, 110);
      doc.setDrawColor(30, 60, 110);
      doc.setLineWidth(0.1);
      doc.rect(x, startY, normalizedWidths[i], headerRowHeight, "FD");
      
      // Header text styling
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      
      // Simple text rendering
      const maxChars = Math.floor(normalizedWidths[i] / 1.8);
      const headerText = header.length > maxChars ? header.substring(0, maxChars - 1) + "..." : header;
      
      // Determine alignment
      const alignment = i === 0 ? "center" : "left";
      const xPos = alignment === "center" ? x + normalizedWidths[i] / 2 : x + 2;
      const yPos = startY + headerRowHeight / 2 + 1.5;
      
      // Draw the header text
      doc.text(headerText, xPos, yPos, { 
        align: alignment as any, 
        baseline: "middle" 
      });
      
      x += normalizedWidths[i];
    });

    // Bottom border of header
    doc.setDrawColor(65, 140, 240);
    doc.setLineWidth(0.8);
    doc.line(margin, startY + headerRowHeight, pageWidth - margin, startY + headerRowHeight);

    return startY + headerRowHeight;
  };

  // Function to draw modern footer
  const drawFooter = (pageNum: number) => {
    // Subtle separator line
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 140);
    doc.setFont("helvetica", "normal");

    // Left: Report name
    doc.text(title, margin, pageHeight - 5);

    // Center: Page number with modern styling
    doc.setFont("helvetica", "bold");
    doc.text(`${pageNum}`, pageWidth / 2 - 3, pageHeight - 5, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`/ ${totalPages}`, pageWidth / 2 + 1, pageHeight - 5, { align: "left" });

    // Right: Generated date
    doc.text(new Date().toLocaleDateString('en-US'), pageWidth - margin, pageHeight - 5, { align: "right" });
  };

  // Draw initial header
  currentY = drawTableHeader(currentY);

  // Draw table data with modern styling
  data.forEach((rowData, dataIndex) => {
    // Check if we need a new page
    if (currentY + rowHeight > pageBottomMargin) {
      drawFooter(pageNumber);
      doc.addPage();
      pageNumber++;
      currentY = margin + 12;
      currentY = drawTableHeader(currentY);
    }

    // Modern alternating row colors
    if (dataIndex % 2 === 0) {
      doc.setFillColor(250, 251, 253);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, currentY, availableWidth, rowHeight, "F");

    // Subtle cell borders
    doc.setDrawColor(235, 238, 242);
    doc.setLineWidth(0.2);
    let x = margin;
    normalizedWidths.forEach((width) => {
      doc.rect(x, currentY, width, rowHeight);
      x += width;
    });

    // Draw cell content with better typography
    doc.setFontSize(8);
    doc.setTextColor(45, 55, 65);
    doc.setFont("helvetica", "normal");

    x = margin;
    rowData.forEach((cell: string | number, colIndex: number) => {
      const cellText = String(cell || "—");
      const maxChars = Math.floor(normalizedWidths[colIndex] / 1.5);
      const truncatedText = cellText.length > maxChars 
        ? cellText.substring(0, maxChars - 1) + "…" 
        : cellText;

      // Smart alignment - center for first column, left for others
      const alignment = colIndex === 0 ? "center" : "left";
      const xPos = alignment === "center" ? x + normalizedWidths[colIndex] / 2 : x + 2;

      doc.text(truncatedText, xPos, currentY + rowHeight / 2 + 1, { 
        align: alignment as any,
        baseline: "middle"
      });
      x += normalizedWidths[colIndex];
    });

    currentY += rowHeight;
  });

  // Draw final footer
  drawFooter(pageNumber);

  // Save with clean filename
  const cleanFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStamp = new Date().toISOString().split("T")[0];
  doc.save(`${cleanFilename}_${dateStamp}.pdf`);
};