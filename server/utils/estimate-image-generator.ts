import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { Estimate } from '@shared/schema';

export interface EstimateImageData {
  estimate: Estimate;
  companyName?: string;
  logoPath?: string;
}

export async function generateEstimateImage(data: EstimateImageData): Promise<string> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'estimates');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const { estimate } = data;
    const companyName = data.companyName || 'PALANIAPPA JEWELLERS';
    
    // Canvas dimensions
    const width = 800;
    const height = 1200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Set initial text properties
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';

    // Company Header
    ctx.font = 'bold 28px Arial';
    ctx.fillText(companyName, width / 2, 60);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillText('JEWELLERY QUOTATION', width / 2, 100);

    // Separator line
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 130);
    ctx.lineTo(width - 50, 130);
    ctx.stroke();

    // Reset text alignment for details
    ctx.textAlign = 'left';
    ctx.font = '16px Arial';
    
    let yPosition = 170;
    const leftMargin = 60;
    const lineHeight = 25;

    // Quotation Details
    ctx.fillText(`Quotation No : ${estimate.quotationNo}`, leftMargin, yPosition);
    yPosition += lineHeight;
    
    const formattedDate = estimate.createdAt ? new Date(estimate.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    ctx.fillText(`Date          : ${formattedDate}`, leftMargin, yPosition);
    yPosition += lineHeight;
    
    ctx.fillText(`Customer      : ${estimate.customerName}`, leftMargin, yPosition);
    yPosition += lineHeight + 10;

    // Dashed line separator
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(leftMargin, yPosition);
    ctx.lineTo(width - leftMargin, yPosition);
    ctx.stroke();
    ctx.setLineDash([]);
    yPosition += 20;

    // Product Details Section
    ctx.font = 'bold 18px Arial';
    ctx.fillText('PRODUCT DETAILS', leftMargin, yPosition);
    yPosition += 10;

    // Another dashed line
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(leftMargin, yPosition);
    ctx.lineTo(width - leftMargin, yPosition);
    ctx.stroke();
    ctx.setLineDash([]);
    yPosition += 25;

    ctx.font = '16px Arial';
    ctx.fillText(`Product Name : ${estimate.productName}`, leftMargin, yPosition);
    yPosition += lineHeight;
    
    ctx.fillText(`Category     : ${estimate.category}`, leftMargin, yPosition);
    yPosition += lineHeight;
    
    ctx.fillText(`Purity       : ${estimate.purity}`, leftMargin, yPosition);
    yPosition += lineHeight;
    
    ctx.fillText(`Gross Weight : ${estimate.grossWeight} g`, leftMargin, yPosition);
    yPosition += lineHeight;
    
    ctx.fillText(`Net Weight   : ${estimate.netWeight} g`, leftMargin, yPosition);
    yPosition += lineHeight;
    
    ctx.fillText(`Product Code : ${estimate.productCode || '-'}`, leftMargin, yPosition);
    yPosition += lineHeight + 20;

    // Another dashed line
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(leftMargin, yPosition);
    ctx.lineTo(width - leftMargin, yPosition);
    ctx.stroke();
    ctx.setLineDash([]);
    yPosition += 5;

    // Price Estimation Section
    ctx.font = 'bold 18px Arial';
    ctx.fillText('PRICE ESTIMATION', leftMargin, yPosition);
    yPosition += 10;

    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(leftMargin, yPosition);
    ctx.lineTo(width - leftMargin, yPosition);
    ctx.stroke();
    ctx.setLineDash([]);
    yPosition += 25;

    ctx.font = '16px Arial';
    
    // Format currency values
    const formatCurrency = (value: string | number): string => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Price breakdown with right-aligned values
    const priceItems = [
      { label: 'Metal Value', value: formatCurrency(estimate.metalValue) },
      { label: `Making Charges (${estimate.makingChargesPercentage}%)`, value: formatCurrency(estimate.makingCharges) },
      { label: 'Stone/Diamond Charges', value: formatCurrency(estimate.stoneDiamondCharges || '0') },
      { label: `Wastage (${estimate.wastagePercentage}%)`, value: formatCurrency(estimate.wastageCharges) },
      { label: 'Hallmarking', value: formatCurrency(estimate.hallmarkingCharges || '450') }
    ];

    priceItems.forEach(item => {
      ctx.fillText(`${item.label.padEnd(25, ' ')} : ${item.value}`, leftMargin, yPosition);
      yPosition += lineHeight;
    });

    // Dashed line before subtotal
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(leftMargin, yPosition);
    ctx.lineTo(width - leftMargin, yPosition);
    ctx.stroke();
    ctx.setLineDash([]);
    yPosition += 20;

    // Subtotal
    ctx.fillText(`Subtotal${' '.repeat(18)} : ${formatCurrency(estimate.subtotal)}`, leftMargin, yPosition);
    yPosition += lineHeight + 10;

    // Tax details
    const gstAmount = Math.round((parseFloat(estimate.subtotal) * 3) / 100);
    ctx.fillText(`GST (3%)${' '.repeat(17)} : ₹ ${gstAmount.toLocaleString('en-IN')}`, leftMargin, yPosition);
    yPosition += lineHeight;
    
    ctx.fillText(`VAT (0%)${' '.repeat(17)} : ₹ 0.00`, leftMargin, yPosition);
    yPosition += lineHeight + 10;

    // Final total with bold styling
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`TOTAL AMOUNT${' '.repeat(12)} : ${formatCurrency(estimate.totalAmount)}`, leftMargin, yPosition);
    yPosition += lineHeight + 20;

    // Valid until
    ctx.font = '16px Arial';
    const validUntilDate = estimate.validUntil ? new Date(estimate.validUntil).toLocaleDateString('en-GB') : 'N/A';
    ctx.fillText(`Valid Until${' '.repeat(14)} : ${validUntilDate}`, leftMargin, yPosition);
    yPosition += lineHeight + 30;

    // Footer
    ctx.textAlign = 'center';
    ctx.font = 'italic 14px Arial';
    ctx.fillText('Thank you for choosing Palaniappa Jewellers!', width / 2, yPosition);

    // Generate filename and save
    const filename = `estimate-${estimate.quotationNo.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.png`;
    const imagePath = path.join(uploadsDir, filename);
    
    // Save the image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(imagePath, buffer);

    return `/uploads/estimates/${filename}`;
  } catch (error) {
    console.error('Error generating estimate image:', error);
    throw new Error('Failed to generate estimate image');
  }
}